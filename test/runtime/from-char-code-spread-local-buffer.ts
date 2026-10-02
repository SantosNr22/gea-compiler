//! expect: abc
//! expect: 0 | A | AB
//! expect: 20 ABCDEFGHIJKLMNOPQRST
//! expect: 70 70 true
//! expect: 4 hi!!
//! expect: 3 1,2,3
//! expect: 😀 2
//! emitted-has: StringConstructor::takeCharCodes(
//! emitted-has: StringConstructor::appendCharCodeTo(
//! emitted-has: fromCharCode.call(

// The array is built by pushes and read only by the spread into fromCharCode, so
// it never needs to be a heap Array.
const decode = (bytes: Uint8Array, start: number, end: number): string | null => {
  const latin = []
  for (let i = start; i < end; i++) {
    const byte = bytes[i]!
    if (byte > 127) return null
    latin.push(byte)
  }
  return String.fromCharCode(...latin)
}

const source = new Uint8Array(100)
for (let i = 0; i < 100; i++) source[i] = 65 + (i % 26)
console.log(decode(new Uint8Array([97, 98, 99]), 0, 3))
console.log(decode(source, 5, 5)!.length, '|', decode(source, 0, 1), '|', decode(source, 0, 2))
const twenty = decode(source, 0, 20)!
console.log(twenty.length, twenty)
// Well past any inline capacity.
const long = decode(source, 0, 70)!
console.log(long.length, decode(source, 0, 70)!.length, long === decode(source, 0, 70))
console.log(decode(new Uint8Array([200]), 0, 1) === null)

// Pushes of computed values, a surrogate pair and a wrapped code.
const pairs = (): string => {
  const units = []
  units.push(0xd83d)
  units.push(0xde00)
  return String.fromCharCode(...units)
}
const smile = pairs()
console.log(smile, smile.length)

// An array that escapes stays an ordinary Array: it is returned and read back.
const escaping = (): number[] => {
  const kept = []
  for (let i = 1; i <= 3; i++) kept.push(i)
  String.fromCharCode(...kept)
  return kept
}
const kept = escaping()
console.log(kept.length, kept.join(','))
const hi = (): string => {
  const codes: number[] = []
  codes.push(104)
  codes.push(105)
  codes.push(33)
  codes.push(33)
  console.log(codes.length, String.fromCharCode(...codes))
  return ''
}
hi()
