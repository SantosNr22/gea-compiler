// A fresh Set built from an array literal and only ever asked `.has()` is a
// membership test over the literal's elements: no Set, no array, no copies of
// the element strings. Everything observable still happens: elements are
// evaluated once, in order, when the literal runs; SameValueZero still makes
// NaN a member of itself and -0 equal to +0; a Set that escapes, is mutated,
// or is asked anything else stays a real Set.
'use strict'
class Mode {
  static readonly PRIMARY = 'primary'
  static readonly PRIMARY_PREFERRED = 'primaryPreferred'
  static readonly SECONDARY_PREFERRED = 'secondaryPreferred'
}

function isValid(mode: string | null): boolean {
  const modes = new Set([Mode.PRIMARY, Mode.PRIMARY_PREFERRED, Mode.SECONDARY_PREFERRED, null])
  return modes.has(mode)
}

function region(name: string | undefined): boolean {
  const known = new Set(['us-east-1', 'eu-west-1'])
  return known.has(name ?? 'none')
}

function literalKey(name: string): boolean {
  return new Set(['ap-south-1', 'ca-central-1']).has(name)
}

function numeric(value: number): string {
  const members = new Set([NaN, 0, 2.5])
  return `${members.has(value)}`
}

let evaluated = 0
const note = (value: string): string => {
  evaluated += 1
  return value
}

function twice(a: string, b: string): string {
  const seen = new Set([note('x'), note('y')])
  return `${seen.has(a)} ${seen.has(b)}`
}

function escapes(): Set<string> {
  const kept = new Set(['kept'])
  return kept
}

function mutated(value: string): boolean {
  const grown = new Set(['a'])
  grown.add(value)
  return grown.has('b')
}

function sized(): number {
  const counted = new Set(['a', 'a', 'b'])
  return counted.size
}

console.log(isValid('primaryPreferred'), isValid('nearest'), isValid(null), isValid('secondaryPreferred'))
console.log(numeric(NaN), numeric(-0), numeric(2.5), numeric(3))
console.log(twice('y', 'z'), evaluated)
console.log(escapes().has('kept'), mutated('b'), sized())
console.log(region('eu-west-1'), region(undefined), literalKey('ca-central-1'), literalKey('x'))
//! expect: true false true true
//! expect: true true true false
//! expect: true false 2
//! expect: true true 2
//! expect: true false true false
export {}
