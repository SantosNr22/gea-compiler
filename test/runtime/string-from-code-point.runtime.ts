// String.fromCodePoint encodes astral points, joins separately passed
// surrogate halves, and throws RangeError for a non-code-point argument;
// String.fromCharCode applies ToUint16 instead of truncating to a byte.
const astral = String.fromCodePoint(0x1f600, 0x41, 0xe9)
console.log(astral.length, astral.codePointAt(0), astral.charCodeAt(2), astral.charCodeAt(3))
const joined = String.fromCodePoint(0xd83d, 0xde00)
console.log(joined === '\u{1F600}', joined.length)
console.log(String.fromCharCode(0x10041, 0xe9, 0x20ac) === 'Aé€')
for (const bad of [-1, 0x110000, 1.5, NaN]) {
  try {
    String.fromCodePoint(bad)
    console.log('no throw', bad)
  } catch (error) {
    console.log(error instanceof RangeError)
  }
}
//! expect: 4 128512 65 233
//! expect: true 2
//! expect: true
//! expect: true
//! expect: true
//! expect: true
//! expect: true
