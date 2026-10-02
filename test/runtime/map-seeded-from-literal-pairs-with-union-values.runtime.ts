// `new Map<K, V>([[k, v]])` with a union value type: the inner literal is the
// `readonly [K, V]` entry tuple the constructor's parameter states, and the
// outer literal is an array OF those tuples -- never an array of `K`.
type Direction = 1 | -1 | 'asc' | 'desc' | { $meta: string }
const directions = new Map<string, Direction>([
  ['z', 'asc'],
  ['y', { $meta: 'textScore' }]
])
for (const [key, value] of directions) console.log(key, typeof value === 'object' ? value.$meta : value)

//! expect: z asc
//! expect: y textScore
