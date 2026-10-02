//! expect: 9 10 11 12 13 14 15 16 17
//! expect: 9 10 11 12 13 14 15 16
//! expect: 233 104 15 109
//! expect: 127 128 65 65 0 0
// A name of nine to sixteen bytes is classified by two overlapping words; a
// non-ASCII byte in either half, or in the middle, must still be seen.
const lengths: number[] = []
for (let size = 9; size <= 17; size++) lengths.push('abcdefghijklmnopq'.slice(0, size).length)
console.log(lengths.join(' '))
// One two-byte character at each position of a nine-to-sixteen byte window.
const accents: number[] = []
const base = 'abcdefghijklmnop'
for (let size = 8; size <= 15; size++) accents.push((base.slice(0, size) + 'é').length)
console.log(accents.join(' '))
const edge = 'abcdefghéijklmn'
console.log(edge.charCodeAt(8), edge.charCodeAt(7), edge.length, edge.charCodeAt(13))
// `String.fromCharCode` of one ASCII code unit appends one byte; everything else keeps ToUint16.
console.log(
  String.fromCharCode(127).charCodeAt(0),
  String.fromCharCode(128).charCodeAt(0),
  String.fromCharCode(65.9).charCodeAt(0),
  String.fromCharCode(65 + 65536).charCodeAt(0),
  String.fromCharCode(NaN).charCodeAt(0),
  String.fromCharCode(-0).charCodeAt(0)
)
