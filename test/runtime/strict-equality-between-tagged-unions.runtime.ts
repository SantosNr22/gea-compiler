//! expect: same number: true false
//! expect: nan: false true
//! expect: zero: true
//! expect: strings: true false
//! expect: cross type: false true
//! expect: objects: true false
//! expect: union vs scalar: true false true
//! expect: union vs string: true false
//! expect: union vs ref: true false
//! expect: absent: true false true
//! expect: booleans: true false
//! expect: mixed unions: true false true false
//! expect: mixed absent: true false true
//! expect: mixed nan: false true

// `===`/`!==` between two tagged unions, and between a tagged union and a
// scalar or a reference, per ECMA-262 IsStrictlyEqual: values of different
// types are never equal, numbers compare by value (NaN unequal to itself,
// +0 equal to -0), strings by content, objects by identity.

class Box {
  constructor(readonly value: number) {}
}

type Key = string | number
type Slot = Box | string | number | undefined

function pick<T>(values: T[], index: number): T {
  return values[index] as T
}

const keys: Key[] = [1, 1, 2, 'a', 'a', 'b', '1', NaN, 0, -0]
const k = (index: number): Key => pick(keys, index)

console.log(`same number: ${k(0) === k(1)} ${k(0) === k(2)}`)
console.log(`nan: ${k(7) === k(7)} ${k(7) !== k(7)}`)
console.log(`zero: ${k(8) === k(9)}`)
console.log(`strings: ${k(3) === k(4)} ${k(3) === k(5)}`)
console.log(`cross type: ${k(0) === k(6)} ${k(0) !== k(6)}`)

const shared = new Box(1)
const slots: Slot[] = [shared, shared, new Box(1), 'x', 3, undefined]
const s = (index: number): Slot => pick(slots, index)
console.log(`objects: ${s(0) === s(1)} ${s(0) === s(2)}`)

const three: number = 3
console.log(`union vs scalar: ${s(4) === three} ${three === s(3)} ${k(2) === 2}`)
const ex: string = 'x'
console.log(`union vs string: ${s(3) === ex} ${ex === s(4)}`)
console.log(`union vs ref: ${s(0) === shared} ${shared === s(2)}`)
console.log(`absent: ${s(5) === s(5)} ${s(5) === s(4)} ${s(5) !== s(0)}`)

type Flag = boolean | string
const flags: Flag[] = [true, true, 'true']
const f = (index: number): Flag => pick(flags, index)
console.log(`booleans: ${f(0) === f(1)} ${f(0) === f(2)}`)

// Two unions whose arm sets differ: same-type arms compare, the rest are false.
type Measure = number | boolean
const measures: Measure[] = [1, true, NaN, -0]
const m = (index: number): Measure => pick(measures, index)
console.log(`mixed unions: ${k(0) === m(0)} ${k(6) === m(0)} ${m(0) !== k(3)} ${f(0) === m(1) && false}`)
const others: Key[] = [3]
console.log(`mixed absent: ${s(4) === pick(others, 0)} ${s(5) === k(0)} ${s(3) !== pick(others, 0)}`)
console.log(`mixed nan: ${k(7) === m(2)} ${k(8) === m(3)}`)
