// A spread or `Object.assign` into a bare record states the copy's order as a
// list of declared-field positions instead of cloning the source's log, a key
// stored afterwards joins that list, and a record whose order is still a list
// is itself spread without building its log. Every step must enumerate as a
// JavaScript object would.
type Opts = { z?: number; a?: number; m?: number; b?: number; c?: number; d?: number }
function made(): Opts {
  return { m: 1, a: 2 }
}
const keys = (value: Opts): string => Object.keys(value).join(',')

const first: Opts = { ...made() }
first.d = 4
first.z = 5
console.log(keys(first))
console.log(JSON.stringify(first))

const second: Opts = { ...first }
second.b = 6
console.log(keys(second))
first.c = 7
console.log(keys(first))
console.log(keys(second))

const assigned: Opts = Object.assign({} as Opts, first)
assigned.c = 8
console.log(keys(assigned))
console.log(JSON.stringify(assigned))

const layered: Opts = Object.assign({} as Opts, made(), { b: 3, m: 9 })
console.log(JSON.stringify(layered))

const readded: Opts = { ...made() }
delete readded.m
readded.m = 8
console.log(JSON.stringify(readded))

const visited: string[] = []
for (const key in second) visited.push(key)
console.log(visited.join(','))

const chained: Opts = { ...{ ...{ ...made() } } }
chained.z = 1
console.log(keys(chained))
//! expect: m,a,d,z
//! expect: {"m":1,"a":2,"d":4,"z":5}
//! expect: m,a,d,z,b
//! expect: m,a,d,z,c
//! expect: m,a,d,z,b
//! expect: m,a,d,z,c
//! expect: {"m":1,"a":2,"d":4,"z":5,"c":8}
//! expect: {"m":9,"a":2,"b":3}
//! expect: {"a":2,"m":8}
//! expect: m,a,d,z,b
//! expect: m,a,z
