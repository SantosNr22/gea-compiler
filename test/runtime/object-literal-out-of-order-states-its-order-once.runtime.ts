// A literal written against its type's layout order at several keys enumerates
// in written order: only its last out-of-order store tells the runtime, and
// that one statement must carry every key before it -- including keys stored
// in order between two out-of-order ones, and keys stored after it.
type O = { a?: number; b?: number; c?: number; d?: number; e?: number; f?: number }
let calls = 0
const next = (): number => ++calls
function build(): O {
  return { e: next(), b: next(), f: next(), a: next(), c: next() }
}
console.log(Object.keys(build()).join(','))
function grow(): O {
  const o: O = { d: 1 }
  o.a = 2
  o.e = 3
  o.b = 4
  o.f = 5
  return o
}
const grown = grow()
console.log(Object.keys(grown).join(','))
grown.c = 6
console.log(Object.keys(grown).join(','))
console.log(JSON.stringify({ ...build() }))
//! expect: e,b,f,a,c
//! expect: d,a,e,b,f
//! expect: d,a,e,b,f,c
//! expect: {"e":6,"b":7,"f":8,"a":9,"c":10}
