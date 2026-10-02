// A spread into a record whose type names fewer keys than the source holds: the
// excess keys are own properties of the copy, created by CreateDataProperty in
// the source's creation order, and a view of the narrow record as the wide one
// reads them back. Covers a fresh receiver, a receiver that already holds keys,
// an excess key a later spread overwrites in place, and a key written after.
type Wide = { z?: number; a?: number; m?: number; b?: number; q?: number; w?: string; k?: boolean }
type Narrow = { a?: number; m?: number; tail?: number }
function wide(): Wide {
  const w: Wide = { m: 1, a: 2, q: 7 }
  w.z = 3
  w.w = 'x'
  return w
}
function other(): Wide {
  const w: Wide = { w: 'y', k: true }
  w.q = 8
  return w
}
const fresh: Narrow = { ...wide() }
console.log(Object.keys(fresh).join(','))
console.log(JSON.stringify(fresh))
const twice: Narrow = { ...wide(), ...other() }
console.log(Object.keys(twice).join(','))
console.log(JSON.stringify(twice))
const after: Narrow = { tail: 1, ...wide() }
console.log(Object.keys(after).join(','))
const later: Narrow = { ...wide(), tail: 4 }
console.log(Object.keys(later).join(','))
const viewed: Wide = twice
console.log(viewed.z, viewed.q, viewed.w, viewed.k, viewed.m)
//! expect: m,a,q,z,w
//! expect: {"m":1,"a":2,"q":7,"z":3,"w":"x"}
//! expect: m,a,q,z,w,k
//! expect: {"m":1,"a":2,"q":8,"z":3,"w":"y","k":true}
//! expect: tail,m,a,q,z,w
//! expect: m,a,q,z,w,tail
//! expect: 3 8 y true 1
