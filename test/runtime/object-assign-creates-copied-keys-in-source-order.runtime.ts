// `Object.assign(target, source)` keeps each key the target already has in
// its place and creates the rest in the SOURCE's creation order -- an
// expando key of the source among them -- whether or not the target has
// needed a creation-order log so far.
type Five = { a?: number; b?: number; c?: number; d?: number; e?: number }

function source(): Five {
  const made: Five = { e: 3 }
  ;(made as Record<string, unknown>)['x'] = 9
  made.a = 4
  made.b = 5
  return made
}

// No log: the target's keys are its declared fields, in layout order.
const plain: Five = { b: 1, d: 2 }
Object.assign(plain, source())
console.log(Object.keys(plain).join(','), plain.b)

// A log: `b` was created after `d`.
const logged: Five = { d: 1 }
logged.b = 2
Object.assign(logged, source())
console.log(Object.keys(logged).join(','), logged.b)

// A source without a log copies in its layout order: after the target's own
// keys, which stay first even when the layout declares them later.
const late: Five = { c: 1 }
Object.assign(late, { a: 2, b: 3 } as Five)
console.log(Object.keys(late).join(','))
const early: Five = { a: 1 }
Object.assign(early, { c: 2, d: 3 } as Five)
console.log(Object.keys(early).join(','))
//! expect: b,d,e,x,a 5
//! expect: d,b,e,x,a 5
//! expect: c,a,b
//! expect: a,c,d
