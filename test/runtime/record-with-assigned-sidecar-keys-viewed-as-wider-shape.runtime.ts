// A RECORD WHOSE KEYS ARRIVED THROUGH Object.assign, VIEWED AS A WIDER SHAPE.
//
// `target` is laid out empty; `Object.assign` creates `limit` on it, which a
// fixed struct can only hold in its dynamic-property sidecar. Viewing the
// object as `{ limit?: number }` afterwards must still see that key: the view
// is the same object, not a fresh one with every optional field absent.
// The generic `merge` below views a fresh literal as `Merged`: its `limit`
// is read from the literal's sidecar, never started absent.

interface Options {
  limit?: number
}

const target = {}
Object.assign(target, { limit: 3 })
const options: Options = target
//! expect: limit=3
console.log(`limit=${options.limit}`)

interface Merged {
  first: number
  limit?: number
}

function merge<T extends Options>(options: T): Merged {
  const merged: Merged = Object.assign({ first: 1 }, options)
  return merged
}
const merged = merge({ limit: 9 })
// The fresh `{ first: 1 }` keeps its own layout (its keys' creation order is
// data -- see `objectAssignFreshTargetType`), so `limit` lands in its
// sidecar. The view as `Merged` builds a new record, and its optional added
// member is read from that sidecar (`record-view.ts`'s `sidecar` read); it
// used to start value-initialized and printed `limit=undefined`.
//! expect: first=1 limit=9
console.log(`first=${merged.first} limit=${merged.limit}`)

function mergeInto<T extends Options>(options: T): Merged {
  const into = { first: 2 }
  Object.assign(into, options)
  const viewed: Merged = into
  return viewed
}
const mergedInto = mergeInto({ limit: 4 })
//! expect: first=2 limit=4
console.log(`first=${mergedInto.first} limit=${mergedInto.limit}`)
