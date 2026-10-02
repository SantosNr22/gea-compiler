// A class instance handed to a parameter stated as a plain data record is the
// object itself, not a copy of its fields: the callee's write is the caller's
// write, and a record literal handed to the same parameter keeps working.
class Counter {
  n = 0
  label = 'c'
}

let last: Counter | null = null

function bump(target: { n: number }): boolean {
  target.n += 1
  return target === last
}

const counter = new Counter()
last = counter
const same = bump(counter)
bump(counter)
const plain = { n: 10 }
bump(plain)
console.log(counter.n, plain.n, same, counter.label)
//! expect: 2 11 true c
