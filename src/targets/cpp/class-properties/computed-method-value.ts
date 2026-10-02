import type { GetOperation } from '../../../ir/model.js'
import type { ClassMethod } from '../../../projection/classes.js'
import type { CallableAbi, Representation } from '../../../representation/model.js'
import { classMethodValueArmsOf, methodCopyHeldBy } from '../../../projection/dispatch.js'
import { abiOfCallee } from '../../../projection/callee.js'
import { createCppEmitBlockedError, operandText, type EmitContext } from '../emit-context.js'
import { cppClassName } from '../types.js'

/** Render the projected read-time selection using the native allocation header.
 * Each arm returns the ordinary method object, preserving its exact thunk and
 * environment even when Function.call later supplies a different receiver.
 */
export const computedOverriddenMethodValueText = (
  ctx: EmitContext,
  operation: GetOperation,
  key: string,
  materialize: (method: ClassMethod) => { readonly text: string; readonly type: string }
): { readonly text: string; readonly type: string } => {
  return overriddenMethodValueText(
    ctx,
    operation.receiver.representation,
    operandText(ctx, operation.receiver),
    key,
    materialize,
    abiOfCallee(operation.result.representation)
  )
}

/** A tagged-union leaf uses the same allocation-selected method as a computed
 * read on a lone class; the static arm is not the allocation's exact class.
 */
export const overriddenMethodValueText = (
  ctx: EmitContext,
  receiver: Representation,
  receiverText: string,
  key: string,
  materialize: (method: ClassMethod) => { readonly text: string; readonly type: string },
  held: CallableAbi | null = null
): { readonly text: string; readonly type: string } => {
  const arms = receiver.kind === 'class-ref' ? classMethodValueArmsOf(ctx.classes, receiver.declaration, key) : null
  if (arms === null)
    throw createCppEmitBlockedError(
      'property-access:computed-class-method-virtual',
      `computed method "${key}" has no complete native prototype selection for this family`
    )
  const values = arms.map((arm) => {
    const method = held === null ? arm.method : heldMethodCopyOf(ctx, arm.method, key, held)
    return { ...arm, ...materialize(method) }
  })
  const type = values[0]!.type
  const branches = values.map(
    (arm) => `if (gea::host::hasNativeClassLayoutRef<${cppClassName(arm.allocation)}>(${receiverText})) return ${arm.text};`
  )
  return { type, text: `([&]() -> ${type} { ${branches.join(' ')} std::abort(); })()` }
}

/**
 * The copy of a generic method's arm the read holds: the projected selection
 * names the owning class's first same-key method, and a generic method's
 * copies all share that key (mongodb's `OnDemandDocument.get<T>`, read at
 * several `T`), so the copy is re-chosen by convention among the owner's own.
 */
export const heldMethodCopyOf = (ctx: EmitContext, method: ClassMethod, key: string, held: CallableAbi): ClassMethod => {
  for (const layout of ctx.classes.values()) {
    if (!layout.methods.includes(method)) continue
    const copies = layout.methods.filter((candidate) => candidate.key === key)
    if (copies.length < 2) return method
    return methodCopyHeldBy(copies, held, ctx.abiOfCallable) ?? method
  }
  return method
}

/**
 * `heldMethodCopyOf` for a union arm's read, whose published carrier may be a
 * sum of callables -- one per receiver arm whose convention differs (an
 * override states its own receiver). The copy is the one every published
 * callable that selects any copy agrees on; where they disagree no copy is
 * chosen and the class's own first stands, which the conversion refuses.
 */
export const publishedMethodCopyOf = (ctx: EmitContext, method: ClassMethod, key: string, published: Representation): ClassMethod => {
  const held = (published.kind === 'tagged-union' ? published.arms.map((arm) => arm.value) : [published]).flatMap((carrier) => {
    const abi = abiOfCallee(carrier)
    return abi === null ? [] : [abi]
  })
  // By body, not by object: a selection arm (`classMethodValueArmsOf`) is
  // not the layout's own entry.
  for (const layout of ctx.classes.values()) {
    if (!layout.methods.some((entry) => entry.key === key && entry.callable === method.callable)) continue
    const copies = layout.methods.filter((candidate) => candidate.key === key)
    if (copies.length < 2) return method
    const chosen = new Set(held.flatMap((abi) => methodCopyHeldBy(copies, abi, ctx.abiOfCallable) ?? []))
    return chosen.size === 1 ? [...chosen][0]! : method
  }
  return method
}
