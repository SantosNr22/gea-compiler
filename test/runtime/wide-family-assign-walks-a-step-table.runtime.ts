//! expect: 6 a,c,e,g,i,k,x,y,z
//! expect: 1 undefined true nested 3 z
//! expect: 13 7 a,c,e,g,i,k,x,y,z
//! expect: 2 hello
//! expect: frozen refused
//! expect: 5

// A copy between two views of an interface family wide enough to walk as a
// step table (`gea::record::assignSteps`) copies exactly the fields the
// source holds, in the source's own key order, keeps a present-but-undefined
// member present, and still refuses a store into a frozen target.
'use strict'
interface Wide {
  a?: number
  b?: string
  c?: boolean
  d?: number[]
  e?: string
  f?: number
  g?: { deep: string }
  h?: boolean
  i?: number
  j?: string
  k?: string
  l?: number
  m?: boolean
  n?: string
  o?: number
  p?: string
  q?: boolean
  r?: number
  s?: string
  t?: number
  u?: boolean
  v?: string
  w?: number
  x?: string
  y?: number
  z?: string
}
interface Wider extends Wide {
  extra?: number
}
const source: Wide = { a: 1, c: true, e: undefined, g: { deep: 'nested' }, i: 3, k: 'k', x: 'x', y: 2, z: 'z' }
const copy: Wider = Object.assign({}, source)
console.log(copy.i! * 2, Object.keys(copy).join(','))
console.log(copy.a, copy.e, 'e' in copy, copy.g?.deep, copy.i, copy.z)
const spread: Wider = { ...source, a: 7 }
console.log(spread.i! * 2 + spread.a!, spread.a, Object.keys(spread).join(','))
const layered: Wider = Object.assign({}, { b: 'hello' } as Wide, { extra: 2 } as Wider)
console.log(layered.extra, layered.b)
const frozen: Wider = Object.freeze({ a: 5 } as Wider)
try {
  Object.assign(frozen, source)
  console.log('frozen accepted')
} catch (error) {
  console.log(error instanceof TypeError ? 'frozen refused' : 'other')
}
console.log(frozen.a)
