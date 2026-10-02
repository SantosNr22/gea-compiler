//! expect: A AB ABC
//! expect: 0 1 0 1
//! expect: € Ѐ
//! expect: 😀 2 2
//! expect: RangeError
//! expect: true true
//! expect: 3 abc
//! emitted-has: gea::host::StringConstructor::fromCharCodeDirect({
//! emitted-has: gea::host::StringConstructor::fromCodePointDirect({
//! emitted-has: gea::host::StringConstructor::fromCharCode.call(

const bytes = new Uint8Array([65, 66, 67])
console.log(String.fromCharCode(bytes[0]!), String.fromCharCode(bytes[0]!, bytes[1]!), String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!))
// ToUint16: wraps, truncates, and non-finite codes become NUL.
const empty = String.fromCharCode()
console.log(empty.length, String.fromCharCode(65536 + 0x41).length, String.fromCharCode(NaN).charCodeAt(0), String.fromCharCode(-1.5).length)
console.log(String.fromCharCode(0x20AC), String.fromCodePoint(0x400))
// A surrogate pair passed as two char codes joins into one code point.
const smile = String.fromCharCode(0xd83d, 0xde00)
console.log(smile, smile.length, String.fromCodePoint(0x1f600).length)
try {
  String.fromCodePoint(0x110000)
  console.log('no throw')
} catch (error) {
  console.log(error instanceof RangeError ? 'RangeError' : 'other')
}
// A first-class alias keeps the ordinary callable value and its identity.
const fromCharCode = String.fromCharCode
console.log(fromCharCode === String.fromCharCode, fromCharCode(66) === 'B')
// A spread keeps the array path.
const codes = [97, 98, 99]
console.log(codes.length, String.fromCharCode(...codes))
