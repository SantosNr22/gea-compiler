// `list.splice(i, 1);` as a statement reads none of the removed elements, so
// the emitter lowers it to an erase; the same call whose result is read still
// answers the removed elements. Parallel-list bookkeeping (an event emitter's
// names/once/handlers) removes from several lists per entry.
'use strict'
const names: string[] = ['data', 'error', 'close', 'data']
const once: boolean[] = [false, true, false, true]
const handlers: Array<(n: number) => number> = [(n) => n + 1, (n) => n * 2, (n) => n - 1, (n) => n * 10]
const remove = (name: string): void => {
  for (let i = names.length - 1; i >= 0; i--) {
    if (names[i] === name) {
      names.splice(i, 1)
      once.splice(i, 1)
      handlers.splice(i, 1)
    }
  }
}
remove('data')
console.log(names.join(','), once.join(','), handlers.map((fn) => fn(3)).join(','))
const numbers = [1, 2, 3, 4, 5, 6]
numbers.splice(1, 2)
console.log(numbers.join(','))
numbers.splice(-2)
console.log(numbers.join(','))
numbers.splice(1, 0, 9, 8)
console.log(numbers.join(','))
const removed = numbers.splice(0, 2)
console.log(removed.join(','), numbers.join(','))
const empty: number[] = []
empty.splice(0, 1)
console.log(empty.length)
//! expect: error,close true,false 6,2
//! expect: 1,4,5,6
//! expect: 1,4
//! expect: 1,9,8,4
//! expect: 1,9 8,4
//! expect: 0
export {}
