// Object.getOwnPropertySymbols over a native record: only its symbol keys,
// in insertion order; a primitive answers empty, null throws TypeError.
const tag = Symbol('tag')
const record = { name: 'x', [tag]: 1 }
const symbols = Object.getOwnPropertySymbols(record)
console.log(symbols.length, symbols[0] === tag, String(symbols[0]))
const plain = { a: 1, b: 2 }
console.log(Object.getOwnPropertySymbols(plain).length, Object.getOwnPropertySymbols('abc').length)
const nothing: unknown = null
try {
  Object.getOwnPropertySymbols(nothing as object)
  console.log('no throw')
} catch (error) {
  console.log(error instanceof TypeError)
}
//! expect: 1 true Symbol(tag)
//! expect: 0 0
//! expect: true
