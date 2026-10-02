// An object literal with accessors, held as `any`, is an ordinary object whose
// accessor properties are OWN, ENUMERABLE and CONFIGURABLE (ECMA-262 13.2.5.5).
// Every enumerating host function reads them through [[Get]], so the getter
// runs once per read with `this` bound to the object -- `Object.entries`,
// `Object.values`, `Object.assign` and spread alike -- and a setter runs on
// assignment. Enumeration keeps creation order across data and accessor keys.
let reads = 0
const source: any = {
  first: 'a',
  get second() {
    reads++
    return this.first + 'b'
  },
  set second(value: string) {
    this.first = value
  },
  third: 3
}

console.log(Object.keys(source).join(','), reads)
//! expect: first,second,third 0

console.log(
  Object.entries(source)
    .map(([key, value]) => `${key}=${value}`)
    .join(','),
  reads
)
//! expect: first=a,second=ab,third=3 1

console.log(JSON.stringify(Object.values(source)), reads)
//! expect: ["a","ab",3] 2

const assigned: any = Object.assign({}, source)
console.log(JSON.stringify(assigned), reads)
//! expect: {"first":"a","second":"ab","third":3} 3

const spread: any = { ...source }
console.log(JSON.stringify(spread), reads)
//! expect: {"first":"a","second":"ab","third":3} 4

source.second = 'z'
console.log(source.first, source.second, reads)
//! expect: z zb 5

const copied = Object.getOwnPropertyDescriptor(assigned, 'second')
console.log(typeof copied?.get, copied?.value, copied?.enumerable, copied?.writable)
//! expect: undefined ab true true

const literal = Object.getOwnPropertyDescriptor(source, 'second')
console.log(typeof literal?.get, typeof literal?.set, literal?.enumerable, literal?.configurable, reads)
//! expect: function function true true 5
