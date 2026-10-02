// A literal written out of layout order enumerates in written order, and so
// does a copy of it into a record of the same type -- including a key stored
// on the copy afterwards, which comes last.
type P = { a?: number; b?: number; c?: number }
function make(): P {
  return { c: 1, a: 2 }
}
const copy: P = { ...make() }
console.log(Object.keys(copy).join(','))
copy.b = 3
console.log(Object.keys(copy).join(','))
const again: P = { ...copy }
console.log(Object.keys(again).join(','))
//! expect: c,a
//! expect: c,a,b
//! expect: c,a,b
