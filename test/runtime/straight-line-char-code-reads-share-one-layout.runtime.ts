// A run of `charCodeAt` reads over one stable formal in straight-line code
// scans the string's UTF-16 layout once, not once per read. The answers must
// be the plain per-read answers: ASCII, a string with astral and BMP
// non-ASCII characters (UTF-16 indices, not byte offsets), and out-of-range
// reads answering NaN. A reassigned parameter is not stable and keeps the
// per-read path, so its reads see the new value.
'use strict'
const nibble = (code: number): number => (code >= 97 ? code - 87 : code >= 65 ? code - 55 : code - 48)
const packHex = (s: string): number =>
  (nibble(s.charCodeAt(0)) << 20) |
  (nibble(s.charCodeAt(1)) << 16) |
  (nibble(s.charCodeAt(2)) << 12) |
  (nibble(s.charCodeAt(3)) << 8) |
  (nibble(s.charCodeAt(4)) << 4) |
  nibble(s.charCodeAt(5))
console.log(packHex('00fFa9'), packHex('123456789abcdef012345678'))
const codes = (s: string): string =>
  [s.charCodeAt(0), s.charCodeAt(1), s.charCodeAt(2), s.charCodeAt(3), s.charCodeAt(4), s.length].join(',')
console.log(codes('héllo'), codes('a😀b'), codes('ab'))
const reassigned = (s: string): string => {
  const first = s.charCodeAt(0)
  s = s + '!'
  return [first, s.charCodeAt(0), s.charCodeAt(s.length - 1)].join(',')
}
console.log(reassigned('x'))
const branched = (s: string, flip: boolean): number => {
  if (flip) return s.charCodeAt(1) + s.charCodeAt(0)
  return s.charCodeAt(0) * 1000 + s.charCodeAt(1)
}
console.log(branched('AZ', true), branched('AZ', false))
//! expect: 65449 1193046
//! expect: 104,233,108,108,111,5 97,55357,56832,98,NaN,4 97,98,NaN,NaN,NaN,2
//! expect: 120,120,33
//! expect: 155 65090
export {}
