// A logged source (a literal written out of its type's order, then a late
// store) copied into a fresh record of ANOTHER type: when the copied keys
// arrive in the receiver's own layout order the receiver needs no log, and it
// must still enumerate exactly as a JS object would; when they do not, it
// keeps the source's order. Spread and Object.assign, with and without keys
// written after the copy.
type Wide = { z?: number; a?: number; m?: number; b?: number; q?: number }
type Narrow = { a?: number; m?: number; b?: number; tail?: number }
function wide(): Wide {
  const w: Wide = { m: 1, a: 2 }
  w.b = 3
  return w
}
function inLayoutOrder(): Wide {
  const w: Wide = { b: 1, a: 2 }
  delete w.b
  w.m = 3
  w.b = 4
  return w
}
const spreadOut: Narrow = { ...wide() }
console.log(Object.keys(spreadOut).join(','))
const spreadIn: Narrow = { ...inLayoutOrder() }
console.log(Object.keys(spreadIn).join(','))
const spreadInTail: Narrow = { ...inLayoutOrder(), tail: 9 }
console.log(Object.keys(spreadInTail).join(','))
spreadIn.tail = 5
console.log(JSON.stringify(spreadIn))
const assignedOut: Narrow = Object.assign({} as Narrow, wide())
console.log(Object.keys(assignedOut).join(','))
const assignedIn: Narrow = Object.assign({} as Narrow, inLayoutOrder())
console.log(Object.keys(assignedIn).join(','))
const held: Narrow = { a: 7 }
Object.assign(held, inLayoutOrder())
console.log(JSON.stringify(held))
function plainA(): Wide {
  return { a: 1 }
}
function loggedMB(): Wide {
  const w: Wide = { b: 1, m: 2 }
  delete w.b
  w.b = 3
  return w
}
function loggedBM(): Wide {
  const w: Wide = { b: 1, m: 2 }
  return w
}
const second: Narrow = { ...plainA(), ...loggedMB() }
console.log(Object.keys(second).join(','))
const secondOut: Narrow = { ...plainA(), ...loggedBM() }
console.log(Object.keys(secondOut).join(','))
//! expect: m,a,b
//! expect: a,m,b
//! expect: a,m,b,tail
//! expect: {"a":2,"m":3,"b":4,"tail":5}
//! expect: m,a,b
//! expect: a,m,b
//! expect: {"a":2,"m":3,"b":4}
//! expect: a,m,b
//! expect: a,b,m
