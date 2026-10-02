import type { IrBlockId, IrBody, IrNonTerminatorOperation, IrOperand } from '../../ir/model.js'
import type { IrValueId } from '../../identity/ids.js'
import { operandsOfIrOperation } from '../../ir/queries.js'
import { representationKey, type Representation } from '../../representation/model.js'

/**
 * Whether rendering this operation writes a C++20 suspension -- `co_await` or
 * `co_yield` -- into the frame.
 *
 * C++ restricts WHERE a suspension may sit, not just whether a function has one:
 * never inside a `catch` handler ([expr.await]/2) and never inside a lambda that
 * is not itself the coroutine. `emit-exceptions.ts` renders a catch handler and
 * a finally clause differently when their blocks hold one, and this is the one
 * question it asks. A `get-iterator` over the async protocol is counted because
 * `for await` awaits every step it takes.
 */
export const operationSuspends = (operation: IrNonTerminatorOperation): boolean =>
  operation.kind === 'await' || operation.kind === 'yield' || (operation.kind === 'get-iterator' && operation.protocol === 'async-iterator')

/**
 * Whether any of these blocks renders a suspension; see `operationSuspends`.
 *
 * One terminator suspends too: a coroutine settling `Promise<void>` takes only
 * `co_return;`, so returning a promise (or a box that may hold one) from it
 * follows that promise with a `co_await` first (`emit-return.ts`'s
 * `coroutineReturnOf`).
 */
export const blocksSuspend = (body: IrBody, blocks: Iterable<IrBlockId>): boolean => {
  const settlesNothing = body.abi?.result.kind === 'promise' && body.abi.result.value.kind === 'void'
  for (const id of blocks) {
    const block = body.blocks.get(id)
    if (!block) continue
    if (block.operations.some(operationSuspends)) return true
    const returned = block.terminator.kind === 'return' ? block.terminator.value : null
    if (settlesNothing && returned && (returned.representation.kind === 'promise' || returned.representation.kind === 'dynamic'))
      return true
  }
  return false
}

/**
 * Whether this body is an async function emitted as a C++20 coroutine returning
 * its `gea::Promise<V>` ABI result.
 *
 * ECMA-262 27.7.5.3 `Await` suspends the running async function and resumes it
 * from a promise job. The runtime's `gea::Promise<V>` is a real pending state
 * with a job queue, and its `promise_type` makes any function returning one
 * whose body holds `co_await`/`co_return` a coroutine: the body runs to its first
 * `co_await`, a `co_return` resolves (adopting a returned promise), and a throw
 * rejects. Every `await` in such a body renders as `co_await`, every return as
 * `co_return`, and the frame owns its parameters, receiver and captures for as
 * long as it is suspended.
 *
 * An async body with no suspension at all keeps the plain-function rendering: it
 * settles before it returns either way, and a frame allocation buys it nothing.
 * `emit.ts` wraps that body in the `try`/`catch` that turns its throw into a
 * rejection, which is what a coroutine's `unhandled_exception` does here.
 *
 * Only a body whose ABI result IS a promise qualifies: the promise type is what
 * makes the coroutine. A suspending async body whose ABI states another carrier
 * is emitted through `asyncPromiseViewOf` below instead. Async GENERATORS are
 * `generator` bodies and are not this.
 *
 * This is the authority `EmitContext.asyncCoroutineBody` is settled from, and
 * `translation-unit.ts`'s `isCoroutineBody` asks it too, so the signature (by
 * value formals, an owned environment copy) and the body's spelling cannot
 * disagree about whether the function is a coroutine.
 */
export const isAsyncCoroutineBody = (body: IrBody): boolean => body.abi?.result.kind === 'promise' && isAsyncSuspendingBody(body)

/** An async non-generator body with at least one suspension, whatever its ABI result says. */
export const isAsyncSuspendingBody = (body: IrBody): boolean =>
  body.async === true && body.generator !== true && [...body.blocks.values()].some((block) => block.operations.some(operationSuspends))

/**
 * The coroutine a suspending async body is emitted as when its ABI result is NOT
 * a promise -- the same body, stating the `Promise<V>` it really returns.
 *
 * An async function always returns a real promise (ECMA-262 27.7.5.1), whatever
 * slot it was written into: an object-literal method contextually typed by an
 * interface member `run(): void` publishes the member's `void` as its result.
 * (`PromiseLike<T>` needs no view: it derives as the same `promise(T)`
 * carrier.) The frame still has to be a
 * coroutine over `gea::Promise`, so `translation-unit.ts` emits this view under
 * a private name and the declared entry forwards to it, converting the promise
 * into the declared view at that one boundary.
 *
 * The payload is `void` when no `return` carries a value; a body returning
 * values into a non-promise view answers `null`, because lowering already
 * converted each value toward the view, and no payload is left to name.
 * `null` too for every body that is not this shape.
 */
export const asyncPromiseViewOf = (body: IrBody): IrBody | null => {
  if (!body.abi || body.abi.result.kind === 'promise' || !isAsyncSuspendingBody(body)) return null
  for (const block of body.blocks.values()) if (block.terminator.kind === 'return' && block.terminator.value !== null) return null
  return { ...body, abi: { ...body.abi, result: { kind: 'promise', value: { kind: 'void' } } } }
}

/** Whether this body is async, suspends, and has a non-promise ABI that no promise view can serve. */
export const isUnviewableAsyncBody = (body: IrBody): boolean =>
  body.abi != null && body.abi.result.kind !== 'promise' && isAsyncSuspendingBody(body) && asyncPromiseViewOf(body) === null

/** Whether resolving a value of this carrier can adopt a promise (`holdsThenable`, `prototype/emit-prototype-promise.ts`). */
const mayAdopt = (carrier: Representation): boolean => {
  if (carrier.kind === 'promise' || carrier.kind === 'dynamic') return true
  if (carrier.kind === 'class-ref') return carrier.nativeBase?.kind === 'promise'
  if (carrier.kind === 'optional') return mayAdopt(carrier.payload)
  if (carrier.kind === 'tagged-union') return carrier.arms.some((arm) => mayAdopt(arm.value))
  return false
}

/**
 * Whether this async coroutine body can ALSO be emitted as a `_task` twin: the
 * same frame returning a `gea::Task<V>` (`runtime/gea_runtime.h`), for a caller
 * that awaits its result at once and keeps no other handle to it.
 *
 * A twin settles a plain value into its frame; it cannot adopt a promise, so
 * the body must never return anything a promise's resolution would adopt: every
 * returned value is exactly the payload the body settles (so no conversion
 * stands between them), and neither the payload nor the value may hold a
 * thenable or a box. A value that arrives through a conversion out of a box
 * is refused too -- `coroutineReturnOf` (`emit-return.ts`) adopts through that
 * one.
 */
export const taskTwinEligible = (body: IrBody): boolean => {
  const result = body.abi?.result
  if (result === undefined || result.kind !== 'promise' || !isAsyncCoroutineBody(body)) return false
  const payload = result.value
  if (mayAdopt(payload)) return false
  const producers = new Map<IrValueId, IrNonTerminatorOperation>()
  for (const block of body.blocks.values())
    for (const operation of block.operations) {
      const produced = 'result' in operation ? operation.result : null
      if (produced !== null && produced !== undefined && 'id' in produced) producers.set(produced.id, operation)
    }
  for (const block of body.blocks.values()) {
    const terminator = block.terminator
    if (terminator.kind !== 'return' || terminator.value === null) continue
    const value = terminator.value
    if (mayAdopt(value.representation)) return false
    if (payload.kind !== 'void' && representationKey(value.representation) !== representationKey(payload)) return false
    const producer = producers.get(value.value)
    if (producer?.kind === 'convert' && producer.source.representation.kind === 'dynamic') return false
  }
  return true
}

/**
 * The call results that are awaited by the very next operation and read
 * nowhere else: `const x = await f()` where `f()` is the only use of its own
 * promise. The caller may then take the callee's `_task` twin
 * (`taskTwinEligible`) instead of a `Promise`, since nothing can observe the
 * difference but the allocation.
 */
export const fusedAwaitCallsOf = (body: IrBody): ReadonlySet<IrValueId> => {
  const reads = new Map<IrValueId, number>()
  const read = (operand: IrOperand): void => {
    reads.set(operand.value, (reads.get(operand.value) ?? 0) + 1)
  }
  for (const block of body.blocks.values()) {
    for (const operation of block.operations) for (const operand of operandsOfIrOperation(operation)) read(operand)
    for (const operand of operandsOfIrOperation(block.terminator)) read(operand)
  }
  for (const region of body.iteratorCloseRegions ?? []) read(region.iterator)
  const fused = new Set<IrValueId>()
  for (const block of body.blocks.values()) {
    const operations = block.operations
    for (let index = 0; index + 1 < operations.length; index += 1) {
      const call = operations[index]
      const awaited = operations[index + 1]
      if (call?.kind !== 'call' || call.result === null || awaited?.kind !== 'await') continue
      if (call.result.representation.kind !== 'promise' || awaited.operand.representation.kind !== 'promise') continue
      if (awaited.operand.value !== call.result.id || reads.get(call.result.id) !== 1) continue
      fused.add(call.result.id)
    }
  }
  return fused
}
