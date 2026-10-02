import type { DeclarationId, IrValueId } from '../identity/ids.js'
import type { NaturalLoop } from './dominance.js'
import type { IrBlockId, IrBody, IrNonTerminatorOperation, IrOperand } from './model.js'
import { operandsOfIrOperation, resultOfIrOperation } from './queries.js'

export interface PcmMap {
  readonly source: IrOperand
  readonly target: IrOperand
  readonly sourceOffset: IrOperand | null
  readonly targetOffset: IrOperand | null
}

type Symbolic =
  | number
  | boolean
  | { readonly kind: 'sample'; readonly region: number }
  | { readonly kind: 'scaled'; readonly scale: number; readonly rounded: boolean }
  | { readonly kind: 'invariant'; readonly operand: IrOperand }
  | { readonly kind: 'index'; readonly base: IrOperand | null; readonly advance: number }
  | { readonly kind: 'round' }

const sameOperand = (a: IrOperand | null, b: IrOperand | null, reads: ReadonlyMap<IrValueId, DeclarationId>): boolean =>
  a === null || b === null ? a === b : a.value === b.value || (reads.has(a.value) && reads.get(a.value) === reads.get(b.value))

/**
 * These are exhaustive equivalence classes, not sampled test inputs. Comparisons
 * on a symbolic sample admit only -1, 0 and 1, so every float32 (including NaN
 * and infinities) follows exactly one of these paths. Products remain symbolic
 * until the store: no finite set of numerical examples can prove quantization.
 */
const regions = [-2, -1, -0.5, 0, 0.5, 1, 2, NaN] as const

const compute = (operator: string, args: readonly Symbolic[]): Symbolic | null => {
  const a = args[0]
  const b = args[1]
  if (operator === '-' && args.length === 1 && typeof a === 'number') return -a
  if (operator === '++' && typeof a === 'object' && a.kind === 'index') return { ...a, advance: a.advance + 1 }
  if (operator === '+' && typeof a === 'object' && typeof b === 'object') {
    const index = a.kind === 'index' ? a : b.kind === 'index' ? b : null
    const base = a.kind === 'invariant' ? a : b.kind === 'invariant' ? b : null
    if (index && base && index.base === null && index.advance === 0) return { ...index, base: base.operand }
  }
  if (operator === '+' && typeof a === 'object' && a.kind === 'index' && b === 1) return { ...a, advance: a.advance + 1 }
  if (operator === '*' && args.length === 2) {
    if (typeof a === 'number' && typeof b === 'number') return a * b
    const sample = typeof a === 'object' && a.kind === 'sample' ? a : typeof b === 'object' && b.kind === 'sample' ? b : null
    const scale = typeof a === 'number' ? a : typeof b === 'number' ? b : null
    if (sample && scale !== null) return { kind: 'scaled', scale, rounded: false }
  }
  if (['<', '>', '<=', '>='].includes(operator)) {
    let left: number
    if (typeof a === 'number') left = a
    else if (typeof a === 'object' && a.kind === 'sample' && (b === -1 || b === 0 || b === 1)) left = a.region
    else return null
    if (typeof b !== 'number') return null
    return operator === '<' ? left < b : operator === '>' ? left > b : operator === '<=' ? left <= b : left >= b
  }
  return null
}

/** A pure contiguous Float32 -> signed PCM16 map, certified from typed IR. */
export const pcmMapOfLoop = (
  body: IrBody,
  loop: NaturalLoop,
  counter: DeclarationId,
  roundCallees: ReadonlySet<IrValueId>
): PcmMap | null => {
  if (body.tryRegions.length || body.iteratorCloseRegions?.length) return null
  const header = body.blocks.get(loop.header)
  if (header?.terminator.kind !== 'branch' || !loop.blocks.has(header.terminator.whenTrue) || loop.blocks.has(header.terminator.whenFalse))
    return null
  if (
    header.operations.some(
      (op) =>
        !['binding-read', 'constant', 'compute'].includes(op.kind) ||
        (op.kind === 'compute' && op.operands.some((value) => value.representation.kind !== 'scalar'))
    )
  )
    return null
  const definitions = new Map<IrValueId, IrNonTerminatorOperation>()
  const reads = new Map<IrValueId, DeclarationId>()
  const writes = new Map<DeclarationId, IrBlockId[]>()
  const locals = new Set<DeclarationId>()
  const results = new Set<IrValueId>()
  for (const [id, block] of body.blocks)
    for (const op of block.operations) {
      const result = resultOfIrOperation(op)
      if (result) {
        definitions.set(result.id, op)
        if (loop.blocks.has(id)) results.add(result.id)
      }
      if (op.kind === 'binding-read') reads.set(op.result.id, op.declaration)
      if (op.kind === 'binding-write') {
        const locations = writes.get(op.declaration) ?? []
        locations.push(id)
        writes.set(op.declaration, locations)
        if (loop.blocks.has(id) && op.declaration !== counter) locals.add(op.declaration)
      }
    }
  if ((writes.get(counter) ?? []).filter((id) => loop.blocks.has(id)).length !== 1) return null
  if (body.facts?.capturedDeclarations.some((declaration) => locals.has(declaration))) return null
  for (const local of locals) if ((writes.get(local) ?? []).some((id) => !loop.blocks.has(id))) return null
  for (const [id, block] of body.blocks)
    if (!loop.blocks.has(id)) {
      for (const op of [...block.operations, block.terminator]) {
        if (op.kind === 'binding-read' && locals.has(op.declaration)) return null
        if (operandsOfIrOperation(op).some((value) => results.has(value.value))) return null
      }
    }
  const invariant = (value: IrOperand): boolean => {
    const declaration = reads.get(value.value)
    if (declaration !== undefined) return !(writes.get(declaration) ?? []).some((id) => loop.blocks.has(id))
    return !results.has(value.value)
  }
  let plan: PcmMap | null = null
  const visitedOperations = new Set<IrNonTerminatorOperation>()
  for (const region of regions) {
    const values = new Map<IrValueId, Symbolic>()
    const cells = new Map<DeclarationId, Symbolic>([[counter, { kind: 'index', base: null, advance: 0 }]])
    let source: IrOperand | null = null
    let sourceOffset: IrOperand | null = null
    let stores = 0
    let current = header.terminator.whenTrue
    let previous = loop.header
    const visited = new Set<IrBlockId>()
    const read = (operand: IrOperand): Symbolic | null => {
      const known = values.get(operand.value)
      if (known !== undefined) return known
      const definition = definitions.get(operand.value)
      if (definition?.kind === 'constant' && definition.literal === 'number') return Number(definition.text)
      return invariant(operand) ? { kind: 'invariant', operand } : null
    }
    while (current !== loop.header) {
      if (!loop.blocks.has(current) || visited.has(current)) return null
      visited.add(current)
      const block = body.blocks.get(current)
      if (!block) return null
      for (const op of block.operations) {
        visitedOperations.add(op)
        let value: Symbolic | null = null
        switch (op.kind) {
          case 'constant':
            value =
              op.literal === 'number'
                ? Number(op.text)
                : { kind: 'invariant', operand: { value: op.result.id, representation: op.result.representation } }
            break
          case 'binding-read':
            value =
              cells.get(op.declaration) ??
              (invariant({ value: op.result.id, representation: op.result.representation })
                ? { kind: 'invariant', operand: { value: op.result.id, representation: op.result.representation } }
                : null)
            break
          case 'binding-write': {
            value = read(op.value)
            if (
              value === null ||
              (op.declaration === counter &&
                !(typeof value === 'object' && value.kind === 'index' && value.base === null && value.advance === 1))
            )
              return null
            cells.set(op.declaration, value)
            break
          }
          case 'phi': {
            const incoming = op.incoming.find((entry) => entry.block === previous)
            value = incoming ? read(incoming.value) : null
            break
          }
          case 'convert':
            if (
              op.result.representation.kind !== 'scalar' ||
              op.result.representation.domain !== 'number' ||
              (!(op.source.representation.kind === 'scalar' && op.source.representation.domain === 'number') &&
                !(
                  op.source.representation.kind === 'optional' &&
                  op.source.representation.payload.kind === 'scalar' &&
                  op.source.representation.payload.domain === 'number'
                ))
            )
              return null
            value = read(op.source)
            break
          case 'compute': {
            const args = op.operands.map(read)
            value = args.some((arg) => arg === null) ? null : compute(op.operator, args as Symbolic[])
            break
          }
          case 'test': {
            const input = read(op.value)
            if (op.predicate !== 'to-boolean') return null
            value =
              typeof input === 'number'
                ? Boolean(input)
                : typeof input === 'object' && input?.kind === 'sample'
                  ? Boolean(input.region)
                  : null
            break
          }
          case 'get': {
            if (roundCallees.has(op.result.id)) {
              value = { kind: 'round' }
              break
            }
            if (
              source !== null ||
              op.receiver.representation.kind !== 'typed-array' ||
              op.receiver.representation.element !== 'float32' ||
              op.receiver.representation.buffer !== 'array-buffer' ||
              !invariant(op.receiver)
            )
              return null
            const index = read(op.key)
            if (typeof index !== 'object' || index?.kind !== 'index' || index.advance !== 0 || (index.base && !invariant(index.base)))
              return null
            source = op.receiver
            sourceOffset = index.base
            value = region === -1 || region === 0 || region === 1 || Number.isNaN(region) ? region : { kind: 'sample', region }
            break
          }
          case 'call': {
            if (!roundCallees.has(op.callee.value) || op.arguments.length !== 1) return null
            const arg = read(op.arguments[0]!)
            value =
              typeof arg === 'number'
                ? Math.round(arg)
                : typeof arg === 'object' && arg?.kind === 'scaled' && !arg.rounded
                  ? { ...arg, rounded: true }
                  : null
            break
          }
          case 'set': {
            if (
              ++stores !== 1 ||
              source === null ||
              op.receiver.representation.kind !== 'typed-array' ||
              op.receiver.representation.element !== 'int16' ||
              op.receiver.representation.buffer !== 'array-buffer' ||
              !invariant(op.receiver)
            )
              return null
            const index = read(op.key)
            const sample = read(op.value)
            if (typeof index !== 'object' || index?.kind !== 'index' || index.advance !== 0 || (index.base && !invariant(index.base)))
              return null
            const expected = region <= -1 ? -32768 : region >= 1 ? 32767 : 0
            if (region === -0.5 || region === 0.5) {
              if (
                typeof sample !== 'object' ||
                sample?.kind !== 'scaled' ||
                !sample.rounded ||
                sample.scale !== (region < 0 ? 32768 : 32767)
              )
                return null
            } else if (sample !== expected) return null
            const next = { source, target: op.receiver, sourceOffset, targetOffset: index.base }
            if (
              plan &&
              (!sameOperand(plan.source, next.source, reads) ||
                !sameOperand(plan.target, next.target, reads) ||
                !sameOperand(plan.sourceOffset, next.sourceOffset, reads) ||
                !sameOperand(plan.targetOffset, next.targetOffset, reads))
            )
              return null
            plan = next
            value = { kind: 'invariant', operand: op.receiver }
            break
          }
          default:
            return null
        }
        if (value === null) return null
        const result = resultOfIrOperation(op)
        if (result) values.set(result.id, value)
      }
      const terminator = block.terminator
      previous = current
      if (terminator.kind === 'jump') current = terminator.target
      else if (terminator.kind === 'branch') {
        const condition = read(terminator.condition)
        if (typeof condition !== 'boolean') return null
        current = condition ? terminator.whenTrue : terminator.whenFalse
      } else return null
    }
    const final = cells.get(counter)
    if (stores !== 1 || typeof final !== 'object' || final.kind !== 'index' || final.advance !== 1) return null
  }
  // Reject effects hidden in paths unreachable for the admitted input domains.
  for (const id of loop.blocks)
    if (id !== loop.header) for (const op of body.blocks.get(id)?.operations ?? []) if (!visitedOperations.has(op)) return null
  return plan
}
