// A method read off a value the program holds as `unknown` and asserts to a
// `Map`. `Map` is a carrier the box's own runtime tag answers for, so the
// assertion is a checked unbox to the native map and `entries()` is the
// native iterator -- not a `[[Get]]` on the box whose result would need a
// dynamic adapter for an iterator-returning callable (which the runtime does
// not have, and which this program used to be refused over).

export {}
const counts = new Map<unknown, unknown>()
counts.set('a', 1)
counts.set('b', 2)
const source: unknown = counts
const iterator = (source as Map<unknown, unknown>).entries()
console.log(JSON.stringify(iterator.next().value))

//! expect: ["a",1]
//! emitted-lacks: getProperty(gea::PropertyKey::string("entries")
