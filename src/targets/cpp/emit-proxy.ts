import type { AllocateProxyOperation, ProxyArmTestOperation, ProxyPartOperation, ProxyTrapCheckOperation } from '../../ir/model.js'
import { representationKey } from '../../representation/model.js'
import { createCppEmitBlockedError, defineValue, operandText, type EmitContext } from './emit-context.js'
import { cppTypeOf } from './types.js'

/**
 * The host constructor this backend builds natively, as a protocol name --
 * read by `host/native-protocols.ts` for the native-boundary claim the
 * `Proxy` global's own carrier needs. `new Proxy(...)` never reaches a host
 * renderer: `ir/lower-proxy.ts` lowers it to `allocate-proxy`, which is what
 * the claim stands behind.
 */
export const cppProxyConstructorProtocols: readonly string[] = ['ProxyConstructor']

/** `gea::ProxyObject<Target, Handler>`, holding the two halves exactly as they arrived. */
export const emitAllocateProxy = (ctx: EmitContext, lines: string[], operation: AllocateProxyOperation): void => {
  const carrier = operation.result.representation
  if (carrier.kind !== 'proxy-object')
    throw createCppEmitBlockedError(
      `runtime-helper:allocation:proxy:${carrier.kind}`,
      `a Proxy is carried as "${representationKey(carrier)}"; this backend builds one only as gea::ProxyObject`
    )
  lines.push(
    `${defineValue(ctx, operation.result)} = ${cppTypeOf(carrier)}(${operandText(ctx, operation.target)}, ${operandText(ctx, operation.handler)});`
  )
}

export const emitProxyPart = (ctx: EmitContext, lines: string[], operation: ProxyPartOperation): void => {
  lines.push(`${defineValue(ctx, operation.result)} = ${operandText(ctx, operation.proxy)}.${operation.part}();`)
}

/** ECMA-262 10.5.9 step 9 / 10.5.10 step 9 in strict code: a falsish answer is a TypeError. */
export const emitProxyTrapCheck = (ctx: EmitContext, lines: string[], operation: ProxyTrapCheckOperation): void => {
  const message = `'${operation.trap}' on proxy: trap returned falsish`
  lines.push(`if (!(${operandText(ctx, operation.answer)})) gea::host::throwRuntimeError("TypeError", ${JSON.stringify(message)});`)
}

/** `u.is<N>()` over every `proxy-object` arm the union's own carrier states. */
export const emitProxyArmTest = (ctx: EmitContext, lines: string[], operation: ProxyArmTestOperation): void => {
  const carrier = operation.value.representation
  const arms =
    carrier.kind === 'tagged-union' ? carrier.arms.flatMap((arm, index) => (arm.value.kind === 'proxy-object' ? [index] : [])) : []
  if (arms.length === 0)
    throw createCppEmitBlockedError(
      'runtime-helper:proxy:arm-test',
      `a proxy-arm test over "${representationKey(carrier)}", which states no proxy arm`
    )
  const text = operandText(ctx, operation.value)
  lines.push(`${defineValue(ctx, operation.result)} = ${arms.map((index) => `${text}.is<${index}>()`).join(' || ')};`)
}
