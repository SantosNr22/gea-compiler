import type { DeclarationId, FunctionId, SemanticResultId } from '../identity/ids.js'
import type { Representation } from '../representation/model.js'
import type { SealedRepresentationPlan } from '../representation/plan.js'
import type { SemanticGraph } from '../semantics/model/graph.js'
import { operandOf, resultOf, type SemanticOperand } from '../semantics/model/operands.js'
import type { SemanticOperation } from '../semantics/model/operations.js'
import type { ClassLayout } from './classes.js'
import { extendsClass } from './dispatch.js'

/**
 * A class method whose own Function object never leaves the native program
 * through a READ of it, and the class that declares it.
 *
 * `callableBindResolution`'s `'builtin-unless-boxed'` asks whether a write on
 * a boxed target (`target[key] = value` with `target: any`) can land on this
 * Function object. It can only if the object was boxed first, and a method's
 * object is reachable two ways:
 *
 *  - a read of the method as a VALUE (`const f = this.log`, `emit(this.log)`)
 *    that goes anywhere but straight into a call or into the receiver of a
 *    `bind`/`call`/`apply` that is itself called. Decided HERE, off the
 *    semantic graph, because it is a fact about the program's reads.
 *  - a boxed instance, prototype or constructor of a class that has the
 *    method, which dynamic code can read it off. That is a fact about the
 *    LOWERED program -- which conversions box which carriers -- and is decided
 *    after lowering by the reflection census (`ir/boxed-bind-assumptions.ts`),
 *    which is why this is an assumption and not a verdict.
 *
 * A bound function is a NEW Function object, so what the program does with
 * the result of `this.log.bind(this)` never reaches `log`'s own object.
 */
export interface UnboxedMethodAssumption {
  readonly callable: FunctionId
  readonly owner: DeclarationId
  readonly key: string
}

export interface MethodValueEscapeInput {
  readonly graph: SemanticGraph
  readonly plan: SealedRepresentationPlan
  readonly classes: ReadonlyMap<DeclarationId, ClassLayout>
}

/** Per class, the method keys some read lets escape as a value; `*` for a read whose key is not known. */
type EscapedKeys = ReadonlyMap<DeclarationId, ReadonlySet<string>>

const anyKey = '*'
const escapedKeysByPlan = new WeakMap<SealedRepresentationPlan, EscapedKeys>()
const deferredBuiltins: ReadonlySet<string> = new Set(['bind', 'call', 'apply'])

/** The classes whose instances a carrier can hold -- and, for a constructor, whose prototype a `prototype` read yields. */
const classesHeldBy = (representation: Representation): readonly DeclarationId[] => {
  switch (representation.kind) {
    case 'class-ref':
      return [representation.declaration]
    case 'constructor-identity':
      return [representation.declaration]
    case 'constructor-family':
      return representation.members
    case 'optional':
      return classesHeldBy(representation.payload)
    case 'borrowed-ref':
      return classesHeldBy(representation.referent)
    case 'tagged-union':
      return representation.arms.flatMap((arm) => classesHeldBy(arm.value))
    default:
      return []
  }
}

const constantKeyOf = (operation: SemanticOperation): string | null => {
  if (operation.family !== 'property' || operation.keyIsComputed) return null
  const key = operandOf(operation, 'key')
  return key?.source.kind === 'constant' ? key.source.text : null
}

const escapedKeysOf = (input: MethodValueEscapeInput): EscapedKeys => {
  const known = escapedKeysByPlan.get(input.plan)
  if (known) return known
  const consumers = new Map<SemanticResultId, { readonly operation: SemanticOperation; readonly operand: SemanticOperand }[]>()
  for (const operation of input.graph.operations.values())
    for (const operand of operation.operands) {
      // A provenance operand re-cites a value another operand evaluates (a
      // call's `receiver` is the object its callee was read off); it is no use.
      if (operand.source.kind !== 'result' || operand.evaluation.kind === 'provenance') continue
      const bucket = consumers.get(operand.source.result)
      if (bucket) bucket.push({ operation, operand })
      else consumers.set(operand.source.result, [{ operation, operand }])
    }
  const onlyCalled = (result: SemanticResultId): boolean =>
    (consumers.get(result) ?? []).every(({ operation, operand }) => operation.family === 'invocation' && operand.role === 'callee')
  const onlyInvokedOrBound = (result: SemanticResultId): boolean =>
    (consumers.get(result) ?? []).every(({ operation, operand }) => {
      if (operation.family === 'invocation' && operand.role === 'callee') return true
      if (operation.family !== 'property' || operation.internalMethod !== 'get' || operand.role !== 'receiver') return false
      const key = constantKeyOf(operation)
      const value = resultOf(operation, 'value')
      return key !== null && deferredBuiltins.has(key) && value !== undefined && onlyCalled(value.id)
    })

  const escaped = new Map<DeclarationId, Set<string>>()
  const escape = (declaration: DeclarationId, key: string): void => {
    const bucket = escaped.get(declaration)
    if (bucket) bucket.add(key)
    else escaped.set(declaration, new Set([key]))
  }
  for (const operation of input.graph.operations.values()) {
    if (operation.family !== 'property' || operation.internalMethod !== 'get') continue
    const receiver = operandOf(operation, 'receiver')
    if (receiver?.source.kind !== 'result') continue
    const held = input.plan.selected.get(receiver.source.result)
    if (held === undefined) continue
    const declarations = classesHeldBy(held)
    if (declarations.length === 0) continue
    const key = constantKeyOf(operation)
    // A computed key can name any method; `prototype` off a constructor is
    // the object every method hangs off.
    const escapedKey = key === null || (key === 'prototype' && held.kind !== 'class-ref') ? anyKey : key
    const value = resultOf(operation, 'value')
    if (escapedKey !== anyKey && value !== undefined && onlyInvokedOrBound(value.id)) continue
    for (const declaration of declarations) escape(declaration, escapedKey)
  }
  escapedKeysByPlan.set(input.plan, escaped)
  return escaped
}

/** Whether two classes share instances: one is the other, or extends it. */
export const classesRelated = (classes: ReadonlyMap<DeclarationId, ClassLayout>, left: DeclarationId, right: DeclarationId): boolean =>
  left === right || extendsClass(classes, left, right) || extendsClass(classes, right, left)

/**
 * The assumption for `callable`, or `null` when it is no instance method or a
 * read already lets its Function object escape.
 */
export const unboxedMethodAssumptionOf = (input: MethodValueEscapeInput, callable: FunctionId): UnboxedMethodAssumption | null => {
  let found: UnboxedMethodAssumption | null = null
  for (const [declaration, layout] of input.classes)
    for (const method of layout.methods)
      if (method.callable === callable) {
        if (found !== null) return null
        found = { callable, owner: declaration, key: method.key }
      }
  if (found === null) return null
  const owner = found
  for (const [declaration, keys] of escapedKeysOf(input))
    if ((keys.has(owner.key) || keys.has(anyKey)) && classesRelated(input.classes, declaration, owner.owner)) return null
  return owner
}
