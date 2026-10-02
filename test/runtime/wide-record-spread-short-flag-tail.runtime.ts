// A spread walks the present declared fields of a wide record eight flags at
// a time, and the walk's short tail (field count not a multiple of eight, or
// fewer than eight fields) must not skip or repeat a key. Each width below
// copies a source logged out of layout order into a fresh record of the same
// type, with and without a later store, then lists the keys. A required union-typed
// field rides along: its record is default-initialized by the allocator, and
// the union must still hold a live arm that the literal then overwrites.
type W3 = { sel: string | number; f0?: number; f1?: number; f2?: number }
type W8 = { sel: string | number; f0?: number; f1?: number; f2?: number; f3?: number; f4?: number; f5?: number; f6?: number; f7?: number }
type W11 = {
  sel: string | number
  f0?: number
  f1?: number
  f2?: number
  f3?: number
  f4?: number
  f5?: number
  f6?: number
  f7?: number
  f8?: number
  f9?: number
  f10?: number
}
type W17 = {
  sel: string | number
  f0?: number
  f1?: number
  f2?: number
  f3?: number
  f4?: number
  f5?: number
  f6?: number
  f7?: number
  f8?: number
  f9?: number
  f10?: number
  f11?: number
  f12?: number
  f13?: number
  f14?: number
  f15?: number
  f16?: number
}
function loggedW3(): W3 {
  const w: W3 = { sel: 'x', f2: 1, f0: 2 }
  w.f1 = 3
  delete w.f0
  w.f0 = 4
  return w
}
const copyW3: W3 = { ...loggedW3() }
console.log(Object.keys(copyW3).join(','))
const widerW3: W3 = { ...loggedW3(), sel: 5 }
console.log(Object.keys(widerW3).join(',') + ':' + widerW3.sel)
function loggedW8(): W8 {
  const w: W8 = { sel: 'x', f7: 1, f0: 2 }
  w.f1 = 3
  delete w.f0
  w.f0 = 4
  return w
}
const copyW8: W8 = { ...loggedW8() }
console.log(Object.keys(copyW8).join(','))
const widerW8: W8 = { ...loggedW8(), sel: 5 }
console.log(Object.keys(widerW8).join(',') + ':' + widerW8.sel)
function loggedW11(): W11 {
  const w: W11 = { sel: 'x', f10: 1, f0: 2 }
  w.f1 = 3
  delete w.f0
  w.f0 = 4
  return w
}
const copyW11: W11 = { ...loggedW11() }
console.log(Object.keys(copyW11).join(','))
const widerW11: W11 = { ...loggedW11(), sel: 5 }
console.log(Object.keys(widerW11).join(',') + ':' + widerW11.sel)
function loggedW17(): W17 {
  const w: W17 = { sel: 'x', f16: 1, f0: 2 }
  w.f1 = 3
  delete w.f0
  w.f0 = 4
  return w
}
const copyW17: W17 = { ...loggedW17() }
console.log(Object.keys(copyW17).join(','))
const widerW17: W17 = { ...loggedW17(), sel: 5 }
console.log(Object.keys(widerW17).join(',') + ':' + widerW17.sel)
//! expect: sel,f2,f1,f0
//! expect: sel,f2,f1,f0:5
//! expect: sel,f7,f1,f0
//! expect: sel,f7,f1,f0:5
//! expect: sel,f10,f1,f0
//! expect: sel,f10,f1,f0:5
//! expect: sel,f16,f1,f0
//! expect: sel,f16,f1,f0:5
