import type { DeclarationId, IrValueId } from '../identity/ids.js'
import { controlFlowGraphOf } from './dominance.js'
import { finallyBlocksOf, implicitSuccessorsOf } from './exception-edges.js'
import type { IrBlockId, IrBody } from './model.js'
import { operandsOfIrOperation } from './queries.js'

/**
 * Cell reads whose every use sees the cell holding exactly what the read saw:
 * no write to the cell lies on any path from the read to the use. Such a read
 * needs no copy of its own -- the emitter can spell the cell itself at every
 * use (`emit-bindings.ts`'s alias path), which for a counted handle, a box or a
 * string is a retain/release pair or a heap copy not made.
 *
 * `emitBindingRead` already aliases a read of a cell the body writes at most
 * once. This is the same answer for a cell written MANY times -- the loop
 * variable of a serializer that reads `value` into a temporary per key, tests
 * it, and only then reassigns it -- decided per read from the control-flow
 * graph rather than from a per-body write count.
 *
 * The walk is a forward flood from the read with two states per block. A
 * block entered CLEAN is scanned from its entry index to the first write to
 * the cell at or past it (`limit`); a use at an index no greater than the
 * limit is fine, including a use AT the write, whose value operand is
 * evaluated before the store. Past a write every successor is entered
 * POISONED, and poison floods onward: a block reached poisoned on ANY path is
 * a block where some execution sees a rewritten cell, so no use in it may
 * alias -- the diamond `if (c) x = other; use(v)` is exactly a clean path and
 * a poisoned path meeting at the use. The read's own block is never re-entered
 * from the top in either state: doing so re-executes the read, and the alias
 * reads the cell at the use anyway, so what follows is that read's business.
 * A merge input (`phi`) is used at the END of the incoming block, which is
 * where `emitBody` writes it, never in the block that holds the phi.
 *
 * Exception regions are edges the graph does not carry. Every block of a try
 * body can reach the region's catch and finally entries by a throw from any
 * of its operations, so each hands them a clean entry when it holds no write
 * and a poisoned one when it holds any (the throw may follow the write). A
 * finally clause runs on every way out of its body -- a `return`, a `break`
 * to a block the graph reaches by an ordinary edge -- with nothing in the
 * graph between, so a cell any finally clause writes is refused outright. An
 * iterator-close region's close block is reached the same way from every
 * block of its loop and hands control to its dismiss targets.
 */
export const stableCellReadsOf = (body: IrBody, admits: (declaration: DeclarationId) => boolean): ReadonlySet<IrValueId> => {
  const stable = new Set<IrValueId>()
  type Site = { readonly block: IrBlockId; readonly index: number }
  const uses = new Map<IrValueId, Site[]>()
  const record = (value: IrValueId, block: IrBlockId, index: number): void => {
    const sites = uses.get(value)
    if (sites) sites.push({ block, index })
    else uses.set(value, [{ block, index }])
  }
  const writes = new Map<IrBlockId, { readonly index: number; readonly declaration: DeclarationId }[]>()
  const reads: { readonly value: IrValueId; readonly declaration: DeclarationId; readonly block: IrBlockId; readonly index: number }[] = []
  for (const [blockId, block] of body.blocks) {
    const written: { readonly index: number; readonly declaration: DeclarationId }[] = []
    for (const [index, operation] of block.operations.entries()) {
      if (operation.kind === 'phi') {
        for (const incoming of operation.incoming)
          record(incoming.value.value, incoming.block, body.blocks.get(incoming.block)?.operations.length ?? 0)
        continue
      }
      for (const operand of operandsOfIrOperation(operation)) record(operand.value, blockId, index)
      if (operation.kind === 'binding-write' || operation.kind === 'binding-renew' || operation.kind === 'allocate-constructor') {
        written.push({ index, declaration: operation.declaration })
      }
      if (operation.kind === 'binding-read' && admits(operation.declaration)) {
        reads.push({ value: operation.result.id, declaration: operation.declaration, block: blockId, index })
      }
    }
    for (const operand of operandsOfIrOperation(block.terminator)) record(operand.value, blockId, block.operations.length)
    writes.set(blockId, written)
  }
  const graph = controlFlowGraphOf(body)
  const implicit = implicitSuccessorsOf(body, graph)
  const finallyWritten = new Set<DeclarationId>()
  for (const block of finallyBlocksOf(body, graph)) for (const write of writes.get(block) ?? []) finallyWritten.add(write.declaration)
  const successorsOf = (block: IrBlockId): readonly IrBlockId[] => [...(graph.successors.get(block) ?? []), ...(implicit.get(block) ?? [])]
  for (const read of reads) {
    const sites = uses.get(read.value)
    if (sites === undefined || finallyWritten.has(read.declaration)) continue
    const firstWriteFrom = (block: IrBlockId, from: number): number => {
      for (const write of writes.get(block) ?? []) if (write.index >= from && write.declaration === read.declaration) return write.index
      return Number.POSITIVE_INFINITY
    }
    const limits = new Map<IrBlockId, number>()
    const poisoned = new Set<IrBlockId>()
    const pending: { readonly block: IrBlockId; readonly clean: boolean }[] = []
    const enter = (block: IrBlockId, from: number): void => {
      const limit = firstWriteFrom(block, from)
      limits.set(block, limit)
      const clean = limit === Number.POSITIVE_INFINITY
      for (const successor of successorsOf(block)) pending.push({ block: successor, clean })
    }
    enter(read.block, read.index + 1)
    while (pending.length > 0) {
      const next = pending.pop()
      if (next === undefined || next.block === read.block) continue
      if (next.clean) {
        if (limits.has(next.block)) continue
        enter(next.block, 0)
        continue
      }
      if (poisoned.has(next.block)) continue
      poisoned.add(next.block)
      for (const successor of successorsOf(next.block)) pending.push({ block: successor, clean: false })
    }
    if (sites.every((site) => !poisoned.has(site.block) && site.index <= (limits.get(site.block) ?? Number.NEGATIVE_INFINITY))) {
      stable.add(read.value)
    }
  }
  return stable
}
