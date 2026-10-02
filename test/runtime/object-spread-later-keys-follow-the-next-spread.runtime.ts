// `{ ...src, ...more, z }` creates `more`'s keys when the second spread runs,
// in `more`'s own creation order, and only then `z`. The first spread's list
// of keys the literal writes after it must not name `more`'s keys: the
// runtime would create them at the FIRST spread, ahead of the keys `more`
// created before them.
type Opts = { a?: number; b?: number; c?: number; d?: number }
function make(): Opts {
  const o: Opts = { c: 1 }
  ;(o as Record<string, unknown>)['x'] = 9
  o.a = 2
  ;(o as Record<string, unknown>)['y'] = 8
  o.b = 3
  return o
}
type Out = { d?: number; a?: number; b?: number; c?: number; z?: number }
function build(src: Opts, more: Opts): Out {
  return { ...src, ...more, z: 5 }
}
const two: Opts = { d: 4 }
;(two as Record<string, unknown>)['q'] = 7
two.a = 6
console.log(Object.keys(build(two, make())).join(','))

// The second source has no creation-order log, so its copy is the static
// copy -- but the receiver's order was already started by the first spread,
// and its keys still follow in the SOURCE's order, not the receiver's layout.
type Reversed = { z?: number; c?: number; b?: number; a?: number; d?: number }
function reversed(src: Opts, more: Opts): Reversed {
  return { ...src, ...more, z: 5 }
}
const plain: Opts = { a: 1, b: 2, c: 3 }
console.log(Object.keys(reversed(two, plain)).join(','))

// The first source has no log, so the receiver has none after its static copy
// either -- its keys are in layout order. The second source's log then orders
// only the keys it creates: the ones the first copy made keep their places.
type Five = { a?: number; b?: number; c?: number; d?: number; e?: number }
type FiveOut = { a?: number; b?: number; c?: number; d?: number; e?: number; z?: number }
function merge(first: Five, second: Five): FiveOut {
  return { ...first, ...second, z: 1 }
}
const first: Five = { b: 1, d: 2 }
const second: Five = { e: 3 }
second.a = 4
second.c = 5
console.log(Object.keys(merge(first, second)).join(','))
//! expect: d,q,a,c,x,y,b,z
//! expect: d,q,a,b,c,z
//! expect: b,d,e,a,c,z
