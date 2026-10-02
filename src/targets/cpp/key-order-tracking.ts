import type { Representation } from '../../representation/model.js'
import type { EmitContext } from './emit-context.js'
import { recordIndexesOfShape, tracksDeclaredFieldCreation } from './records.js'

/**
 * Whether a record's key creation order is provably read by nothing in the
 * program (`ir/key-order-observation.ts`), so no store, literal, spread or
 * assign into it keeps any creation-order bookkeeping. A record with an index
 * sidecar is never proven: its sidecar keys interleave with the declared ones.
 */
export const keyOrderUnobservedIn = (ctx: EmitContext, representation: Representation): boolean => {
  if (ctx.keyOrderUnobserved.size === 0) return false
  if (representation.kind === 'record') return ctx.keyOrderUnobserved.has(representation.shapeId)
  if (representation.kind === 'native-record-ref' && representation.native === null && representation.recursive === undefined)
    return ctx.keyOrderUnobserved.has(representation.shapeId) && recordIndexesOfShape(ctx.deriver, representation.shapeId).length === 0
  return false
}

/** `tracksDeclaredFieldCreation`, except for a record whose creation order nothing reads. */
export const tracksKeyOrder = (ctx: EmitContext, representation: Representation): boolean =>
  tracksDeclaredFieldCreation(representation) && !keyOrderUnobservedIn(ctx, representation)
