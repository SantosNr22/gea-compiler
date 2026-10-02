import type { DeclarationId, PhysicalBodyId } from '../identity/ids.js'
import type { ClassLayout } from '../projection/classes.js'
import { classesRelated } from '../projection/method-value-escapes.js'
import type { Representation } from '../representation/model.js'
import type { BindCallableOperation, IrBody } from './model.js'
import type { ReflectionExposure } from './reflection-demand.js'

/**
 * Confirm or leave unconfirmed every builtin `bind` lowered on the assumption
 * that its method's Function object is never boxed
 * (`projection/method-value-escapes.ts`).
 *
 * The object reaches dynamic code through a boxed instance of a class that
 * has the method -- which the reflection census records as a FULL demand on
 * that class (`object-to-dynamic-conversion`; every class carries a sealed
 * keys-only row, which answers no read) -- or through a boxed constructor,
 * whose `prototype` holds it. A class related to the method's owner either way
 * counts: a boxed base-typed value may be the subclass instance, and a boxed
 * subclass instance inherits the method.
 *
 * An incomplete census proves nothing, so nothing is confirmed then. A
 * confirmed bind renders as the bare native bind; an unconfirmed one renders
 * the same native bind behind a run-time check that the Function object has
 * no own `bind`, falling back to the program's own `bind` when it does
 * (`emit-callable.ts`'s `guardedBindLines`).
 */
export const confirmUnboxedMethodBinds = (
  bodies: ReadonlyMap<PhysicalBodyId, IrBody>,
  exposure: ReflectionExposure,
  classes: ReadonlyMap<DeclarationId, ClassLayout>
): ReadonlyMap<PhysicalBodyId, IrBody> => {
  const boxedConstructors = new Set<DeclarationId>()
  // A constructor carried by its convention alone names no class, so boxing
  // one may have boxed any of them.
  let boxedUnknownConstructor = false
  let assumed = false
  for (const body of bodies.values())
    for (const block of body.blocks.values())
      for (const operation of block.operations) {
        if (operation.kind === 'bind-callable' && operation.unboxedMethod !== undefined) assumed = true
        if (operation.kind !== 'convert' || operation.result.representation.kind !== 'dynamic') continue
        const held = constructorsHeldBy(operation.source.representation)
        if (held === null) boxedUnknownConstructor = true
        else for (const declaration of held) boxedConstructors.add(declaration)
      }
  if (!assumed || !exposure.complete || boxedUnknownConstructor) return bodies

  const exposed = [
    ...[...exposure.classes].flatMap(([declaration, demand]) => (demand.level === 'full' ? [declaration] : [])),
    ...boxedConstructors
  ]
  const confirmed = (operation: BindCallableOperation): boolean => {
    const owner = operation.unboxedMethod?.owner
    return owner !== undefined && !exposed.some((declaration) => classesRelated(classes, declaration, owner))
  }
  const confirmedBodies = new Map<PhysicalBodyId, IrBody>()
  for (const [bodyId, body] of bodies) {
    let changed = false
    const blocks = new Map(body.blocks)
    for (const [blockId, block] of body.blocks) {
      let blockChanged = false
      const operations = block.operations.map((operation) => {
        if (operation.kind !== 'bind-callable' || operation.unboxedMethod === undefined || !confirmed(operation)) return operation
        blockChanged = true
        return { ...operation, unboxedMethodConfirmed: true }
      })
      if (!blockChanged) continue
      changed = true
      blocks.set(blockId, { ...block, operations })
    }
    confirmedBodies.set(bodyId, changed ? { ...body, blocks } : body)
  }
  return confirmedBodies
}

/** The classes whose constructor a carrier can hold; `null` when it holds one it cannot name. */
const constructorsHeldBy = (representation: Representation): readonly DeclarationId[] | null => {
  switch (representation.kind) {
    case 'constructor-identity':
      return [representation.declaration]
    case 'constructor-family':
      return representation.members
    // A plain `function`'s prototype is its own, never a class's.
    case 'constructor-value-dispatch':
      return null
    case 'optional':
      return constructorsHeldBy(representation.payload)
    case 'borrowed-ref':
      return constructorsHeldBy(representation.referent)
    case 'tagged-union': {
      const arms = representation.arms.map((arm) => constructorsHeldBy(arm.value))
      return arms.some((arm) => arm === null) ? null : arms.flatMap((arm) => arm ?? [])
    }
    default:
      return []
  }
}
