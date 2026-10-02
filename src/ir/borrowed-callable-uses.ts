import type { FunctionId, IrValueId, RegionId } from '../identity/ids.js'
import { allOperationsOf, type ConstructOperation, type IrBody, type IrOperation } from './model.js'
import { operandsOfIrOperation } from './queries.js'

/**
 * `allocate-callable` results eligible for a STACK-RESIDENT environment
 * instead of a `gea::HeapEnvironmentBlock` -- see `gea_runtime.h`'s
 * `packBorrowedEnvironment`.
 *
 * The contract this proves, whole-program: the allocation's value is used
 * EXACTLY ONCE, in the SAME block it is allocated in, as the sole argument of
 * a call the runtime has already committed to invoking synchronously and
 * never retaining -- so far, `new Promise(executor)` alone
 * (`gea::host::PromiseConstructor::construct`/`constructVoid`, whose
 * `ExecutorRunner`/`VoidExecutorRunner` call the executor exactly once,
 * inside the constructor, and store it nowhere). A closure meeting this is
 * never named again after that one call returns, so its environment need not
 * outlive the statement that builds it -- the allocating frame's own stack is
 * storage enough, and nothing has to count references to it.
 *
 * Same-block is a deliberate simplification, not a fundamental limit: it lets
 * this walk treat "when does the borrow start and end" as "this block's own
 * text order", with no dominance or liveness question to answer, at the cost
 * of missing a same-body executor built in an earlier block (an `if` that
 * assigns it, joined before `new Promise(...)`) -- which keeps its
 * `HeapEnvironmentBlock` exactly as before, a missed optimization rather than
 * a wrong one.
 *
 * Admits `function`, `function-family`, `function-value-family`, and
 * `function-value-dispatch` WITHOUT a `recursive` signature -- `types.ts`'s
 * `cppTypeOf` renders every one of those as the identical bare
 * `gea::CallableObject<ABI>`, which is all this module's borrow branch ever
 * builds, so the family/dispatch distinction (how many declarations a
 * STATED type admits) is orthogonal to whether THIS allocation's one
 * instance can live on the stack. `new Promise(executor)` is the case that
 * makes this matter in practice: `Promise`'s constructor states its
 * executor as an ABI, not a specific declaration, so an ordinary arrow
 * passed there is carried as `function-value-dispatch` even when its own
 * `functionId` (what this module keys eligibility on throughout) names one
 * concrete body -- restricting to plain `function` alone left every real
 * executor on the heap path. A recursive `function-value-dispatch` (its
 * signature mentions itself) spells a NAMED wrapper container instead of a
 * bare `CallableObject`, so it is excluded along with `function-and-
 * constructor` (a second [[Construct]] thing a borrow cannot outlive
 * independently) and an `optional`-wrapped carrier (nullable storage this
 * module does not reason about).
 *
 * The target function's own body must actually own an environment (an empty
 * one is already free), must not be a recursion-group member (the group's
 * environment is shared and outlives any one member's allocation site by
 * construction), and must not suspend (`async`/generator/`await`/`yield`):
 * a suspending executor can return control to its caller before finishing,
 * which would let the allocating frame's statement complete -- and, for an
 * ordinary (non-coroutine) allocating function, its stack -- move on while
 * the suspended callable still expects to resume into the borrowed state.
 *
 * Callable-identity is deliberately NOT checked here: whether the runtime
 * ever mints a `FunctionObjectIdentity` for this convention
 * (`ir/callable-identity-demand.ts`) is a whole-program, CONVENTION-keyed
 * question answered independently, and `emit-callable.ts` applies it as a
 * second, separate gate before actually emitting a borrow -- keeping this
 * module's own contract to the one question its name asks.
 */
export const borrowedExecutorAllocationsOf = (bodies: readonly IrBody[]): ReadonlySet<IrValueId> => {
  const bodyByOwner = new Map<FunctionId | RegionId, IrBody>()
  for (const body of bodies) bodyByOwner.set(body.sourceOwner, body)

  const suspends = (body: IrBody): boolean =>
    body.async === true ||
    body.generator === true ||
    [...body.blocks.values()].some((block) =>
      allOperationsOf(block).some((operation) => operation.kind === 'yield' || operation.kind === 'await')
    )

  const eligibleTargets = new Map<FunctionId, boolean>()
  const eligibleTarget = (functionId: FunctionId): boolean => {
    const cached = eligibleTargets.get(functionId)
    if (cached !== undefined) return cached
    const body = bodyByOwner.get(functionId)
    const facts = body?.facts
    const eligible =
      body !== undefined &&
      facts !== undefined &&
      facts.captureGroup === undefined &&
      (facts.capturedDeclarations.length > 0 || facts.capturedReceiver !== null) &&
      !suspends(body)
    eligibleTargets.set(functionId, eligible)
    return eligible
  }

  // Every native construct site this module recognises as a synchronous,
  // non-retaining call through its first (and only) argument. A second host
  // contract joins this as a second arm, never a rewrite of this one.
  const isPromiseExecutorConstruct = (operation: IrOperation): operation is ConstructOperation =>
    operation.kind === 'construct' &&
    operation.arguments.length === 1 &&
    operation.callee.representation.kind === 'native-handle' &&
    operation.callee.representation.protocol === 'PromiseConstructor'

  const eligible = new Set<IrValueId>()
  for (const body of bodies) {
    for (const blockId of body.blockOrder) {
      const block = body.blocks.get(blockId)
      if (!block) continue
      const candidates = new Map<IrValueId, true>()
      for (const operation of block.operations) {
        if (operation.kind !== 'allocate-callable') continue
        const payload = operation.result.representation
        const borrowableCarrier =
          payload.kind === 'function' ||
          payload.kind === 'function-family' ||
          payload.kind === 'function-value-family' ||
          (payload.kind === 'function-value-dispatch' && payload.recursive === undefined)
        if (!borrowableCarrier) continue
        if (!eligibleTarget(operation.functionId)) continue
        candidates.set(operation.result.id, true)
      }
      if (candidates.size === 0) continue
      const useCounts = new Map<IrValueId, number>()
      const matchedExecutorSite = new Set<IrValueId>()
      for (const operation of allOperationsOf(block)) {
        if (isPromiseExecutorConstruct(operation)) {
          const executorId = operation.arguments[0]?.value
          if (executorId !== undefined && candidates.has(executorId)) matchedExecutorSite.add(executorId)
        }
        for (const operand of operandsOfIrOperation(operation)) {
          if (!candidates.has(operand.value)) continue
          useCounts.set(operand.value, (useCounts.get(operand.value) ?? 0) + 1)
        }
      }
      for (const id of candidates.keys()) {
        if (useCounts.get(id) === 1 && matchedExecutorSite.has(id)) eligible.add(id)
      }
    }
  }
  return eligible
}
