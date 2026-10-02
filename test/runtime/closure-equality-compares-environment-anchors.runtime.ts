// Two heap-environment closures compare by identity without either side
// minting a function object: the same closure read through two names is
// equal, two evaluations of one declaration are not, and a listener list
// scanned with `===` finds exactly the registered entry.
'use strict'
type Handler = (value: number) => number
const make =
  (offset: number, label: string): Handler =>
  (value) =>
    value + offset + label.length
const a = make(1, 'a')
const b = make(2, 'bb')
const alias = a
const list: Handler[] = [a, b, make(3, 'ccc')]
let index = -1
for (let i = 0; i < list.length; i++) if (list[i] === b) index = i
console.log(alias === a, a === b, index, list[0] === alias)
const removeOne = (handlers: Handler[], target: Handler): number => {
  for (let i = 0; i < handlers.length; i++) {
    if (handlers[i] === target) {
      handlers.splice(i, 1)
      return i
    }
  }
  return -1
}
const third = list[2]!
console.log(removeOne(list, third), removeOne(list, make(1, 'a')), list.length)
const twice = (): Handler => make(9, 'z')
console.log(twice() === twice(), a(1), b(1))
//! expect: true false 1 true
//! expect: 2 -1 2
//! expect: false 3 5
export {}
