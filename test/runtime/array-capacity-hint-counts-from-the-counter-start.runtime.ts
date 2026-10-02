//! expect: 3 11,12,13
//! expect: 0 -
//! expect: 3 21,22,23
//! expect: 0 -
//! expect: 4 5,6,7,8
//! expect: 1 -
// bson's `tryReadBasicLatin` pushes the bytes of a key that starts at some
// offset into the buffer: `for (let i = start; i < end; i++) bytes.push(...)`.
// The capacity hint is the loop's trip count, `end - start`; the test's bound
// alone reserved `end` slots for every key.
function window(bytes: number[], start: number, end: number): number[] | null {
  const out: number[] = []
  for (let index = start; index < end; index++) {
    if (bytes[index]! > 127) return null
    out.push(bytes[index]! + 1)
  }
  return out
}
function inclusive(bytes: number[], start: number, end: number): number[] {
  const out: number[] = []
  for (let index = start; index <= end; index++) out.push(bytes[index]! + 1)
  return out
}
function fromLiteral(bytes: number[], end: number): number[] {
  const out: number[] = []
  for (let index = 5; index < end; index++) out.push(bytes[index]!)
  return out
}
const buffer: number[] = []
for (let value = 0; value < 300; value++) buffer.push(value < 150 ? value : 200)
const taken = window(buffer, 10, 13)
console.log(taken?.length, taken?.join(','))
const backwards = window(buffer, 13, 10)
console.log(backwards?.length, backwards!.length === 0 ? '-' : 'x')
const closed = inclusive(buffer, 20, 22)
console.log(closed.length, closed.join(','))
const none = inclusive(buffer, 22, 20)
console.log(none.length, none.length === 0 ? '-' : 'x')
const literal = fromLiteral(buffer, 9)
console.log(literal.length, literal.join(','))
const refused = window(buffer, 148, 152)
console.log(refused === null ? 1 : 0, refused === null ? '-' : refused.join(','))
