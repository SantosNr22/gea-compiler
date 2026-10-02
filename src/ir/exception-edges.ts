import type { ControlFlowGraph } from './dominance.js'
import type { IrBlockId, IrBody } from './model.js'

/**
 * Blocks reachable from `from` by ordinary edges without entering `stop`: an
 * OVER-approximation of a region's body (a `break` out of the body reaches
 * blocks past it too), which only adds implicit edges, never removes one.
 */
const reachableWithin = (graph: ControlFlowGraph, from: IrBlockId, stop: ReadonlySet<IrBlockId>): ReadonlySet<IrBlockId> => {
  const seen = new Set<IrBlockId>()
  const pending = [from]
  while (pending.length > 0) {
    const next = pending.pop()
    if (next === undefined || seen.has(next) || stop.has(next)) continue
    seen.add(next)
    pending.push(...(graph.successors.get(next) ?? []))
  }
  return seen
}

/**
 * Control-flow edges the graph does not carry, for a forward walk that must
 * see every path an execution can take.
 *
 * Every block of a try body can reach the region's catch and finally
 * entries by a throw from any of its operations, and every block of a catch
 * clause can reach the finally entry the same way. An iterator-close
 * region's close block is reached from every block of its loop and hands
 * control to its dismiss targets. A `finally` clause also runs on a
 * `return` or a `break` out of its body; those leave by ordinary edges the
 * graph does carry, through the finally entry.
 */
export const implicitSuccessorsOf = (body: IrBody, graph: ControlFlowGraph): ReadonlyMap<IrBlockId, readonly IrBlockId[]> => {
  const implicit = new Map<IrBlockId, IrBlockId[]>()
  const add = (from: IrBlockId, to: IrBlockId | null): void => {
    if (to === null) return
    const targets = implicit.get(from)
    if (targets) targets.push(to)
    else implicit.set(from, [to])
  }
  for (const region of body.tryRegions) {
    const stop = new Set<IrBlockId>()
    for (const block of [region.catchEntry, region.finallyEntry, region.finallyExit, region.join]) if (block !== null) stop.add(block)
    for (const block of reachableWithin(graph, region.tryEntry, stop)) {
      add(block, region.catchEntry)
      add(block, region.finallyEntry)
    }
    if (region.catchEntry !== null) for (const block of reachableWithin(graph, region.catchEntry, stop)) add(block, region.finallyEntry)
  }
  for (const region of body.iteratorCloseRegions ?? []) {
    for (const block of region.blocks) add(block, region.entry)
    for (const target of region.dismissTargets) add(region.entry, target)
  }
  return implicit
}

/** The blocks of every `finally` clause in the body, over-approximated the same way as a try body. */
export const finallyBlocksOf = (body: IrBody, graph: ControlFlowGraph): ReadonlySet<IrBlockId> => {
  const blocks = new Set<IrBlockId>()
  for (const region of body.tryRegions) {
    if (region.finallyEntry === null) continue
    const stop = new Set<IrBlockId>(region.finallyExit === null ? [] : [region.finallyExit])
    for (const block of reachableWithin(graph, region.finallyEntry, stop)) blocks.add(block)
    if (region.finallyExit !== null) blocks.add(region.finallyExit)
  }
  return blocks
}
