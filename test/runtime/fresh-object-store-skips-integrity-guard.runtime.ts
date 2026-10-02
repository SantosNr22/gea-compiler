// A store onto an object the same block just allocated has nothing to
// check: no freeze can have reached an object nothing else has seen. With
// `Object.freeze` in the program every other store keeps its guard, and a
// store after the object escaped into that freeze still refuses.
'use strict'
interface Options {
  retries?: number
  name?: string
  frozen?: boolean
}
const build = (name: string): Options => {
  const options: Options = {}
  options.retries = 3
  options.name = name
  return options
}
const first = build('first')
console.log(first.retries, first.name)
const sealed: Options = { retries: 1 }
Object.freeze(sealed)
let refused = false
try {
  sealed.retries = 2
} catch (error) {
  refused = error instanceof TypeError
}
console.log(refused, sealed.retries)
const escaped = (options: Options): void => {
  Object.freeze(options)
}
const second: Options = {}
second.retries = 5
escaped(second)
let refusedAfterEscape = false
try {
  second.name = 'late'
} catch (error) {
  refusedAfterEscape = error instanceof TypeError
}
console.log(refusedAfterEscape, second.retries, second.name)
//! expect: 3 first
//! expect: true 1
//! expect: true 5 undefined
export {}
