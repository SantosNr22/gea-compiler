import type { Representation } from './model.js'

/** The arm layout above, read off a `tagged-union` -- or `null` when it is a real sum this file has no JSON discriminator for. */
export interface NullableUnionArms {
  readonly nullIndex: number
  readonly presentIndex: number
  /** `-1` when the union carries no `undefined` arm. Only a record FIELD reads this: an `undefined` property is omitted from the object entirely (ECMA-262 25.5.2.2), which no standalone overload has a spelling for. */
  readonly undefinedIndex: number
  readonly payload: Representation
}

/**
 * Whether `representation` is one JSON-carrying arm plus absence arms.
 *
 * Anything wider is a genuine sum with no JSON discriminator -- a document
 * says `3`, not which arm of `number | Point` produced it -- so it answers
 * `null` and the caller refuses by name. Shared by the collector and by the
 * record renderer so both read exactly one rule.
 */
export const nullableUnionArmsOf = (representation: Representation): NullableUnionArms | null => {
  if (representation.kind !== 'tagged-union') return null
  const nullIndex = representation.arms.findIndex((arm) => arm.value.kind === 'null')
  const undefinedIndex = representation.arms.findIndex((arm) => arm.value.kind === 'undefined')
  const presentIndex = representation.arms.findIndex((arm) => arm.value.kind !== 'null' && arm.value.kind !== 'undefined')
  const absenceCount = (nullIndex === -1 ? 0 : 1) + (undefinedIndex === -1 ? 0 : 1)
  const payload = representation.arms[presentIndex]?.value
  if (nullIndex === -1 || presentIndex === -1 || payload === undefined) return null
  if (representation.arms.length !== absenceCount + 1) return null
  return { nullIndex, presentIndex, undefinedIndex, payload }
}
