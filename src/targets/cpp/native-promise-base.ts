import type { Representation } from '../../representation/model.js'
import { representationKey } from '../../representation/model.js'
import { cppTypeOf } from './types.js'

/** One argument reaching a native promise base, already rendered as C++. */
export interface NativePromiseBaseArgument {
  readonly representation: Representation
  readonly text: string
}

type NativePromise = Extract<Representation, { readonly kind: 'promise' }>

/**
 * `super(executor)` against the intrinsic `Promise` base, as statements run
 * on a receiver that already exists -- shared by a written `super(...)` and
 * the implicit `constructor(...args) { super(...args) }`, for
 * `native-error-base.ts`'s reason: they are one language step.
 *
 * ECMA-262 27.2.3.1: the promise the resolving functions settle is the
 * derived struct's own base subobject, so every copy of the instance viewed
 * as its promise observes the settlement. The executor is the callable the
 * lowering already typed against `PromiseConstructor`'s construct signature,
 * which is the same carrier `new Promise(executor)` hands the runtime.
 */
export const nativePromiseBaseInitializeStatements = (
  receiverName: string,
  base: NativePromise,
  args: readonly (NativePromiseBaseArgument | undefined)[]
): readonly string[] | string => {
  const executor = args[0]
  // 27.2.3.1 step 2: an executor that is not callable is a TypeError; the
  // checker admits no call without one, so a missing or non-callable carrier
  // is a lowering this renderer refuses rather than a promise left pending.
  if (executor === undefined || args.length !== 1) {
    return `a Promise base is initialized with exactly one executor; this super call passes ${args.length}`
  }
  const carrier = executor.representation
  if (carrier.kind !== 'function' && carrier.kind !== 'function-value-dispatch') {
    return `a Promise base's executor is carried as "${representationKey(carrier)}", which is not a callable this runtime can run`
  }
  const target = `static_cast<${cppTypeOf(base)}&>(*${receiverName})`
  const helper = base.value.kind === 'void' ? 'initializeVoid' : `initialize<${cppTypeOf(base.value)}>`
  return [`gea::host::PromiseConstructor::${helper}(${target}, ${executor.text});`]
}
