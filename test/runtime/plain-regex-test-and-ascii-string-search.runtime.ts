// `RegExp.prototype.test` on a plain pattern runs the runtime's native
// backtracking matcher over the UTF-8 bytes, and an ASCII needle makes
// `indexOf`/`lastIndexOf` a byte search; `startsWith`/`endsWith` at the ends
// compare bytes. Each answer here is Node's, including where bytes and UTF-16
// code units disagree: non-ASCII input against an ASCII-only pattern, `.`
// counting code units, and a needle that is half a surrogate pair.
const host = /^[a-z0-9._-]+(?::(?:[1-5]\d{3,4}|[6-9]\d{3}))?$/
const path = /^\/[!#$&-;=?-\[\]_a-z~]*$/
const dots = /\/\.\.?(?:[/?#]|$)/
//! expect: true false true false
console.log(`${host.test('localhost:3900')} ${host.test('LOCALHOST')} ${host.test('a.b_c-d')} ${host.test('naïve:3000')}`)
//! expect: true false false true true
console.log(`${path.test('/a/b')} ${path.test('/a b')} ${path.test('/é')} ${dots.test('/x/..')} ${dots.test('é/./')}`)
//! expect: true false true false
console.log(`${/\bfoo\b/.test('é foo é')} ${/\bfoo\b/.test('food')} ${/^(?:a|ab)(?:c|bcd)$/.test('abcd')} ${/^.{2}$/.test('é')}`)
//! expect: true true false true
console.log(`${/^.{2}$/.test('\u{1F600}')} ${/(a|)+b/.test('aab')} ${/x{2,3}y/.test('xy')} ${/colou?r/.test('a color')}`)

const head = 'Host: localhost:3900\r\nUser-Agent: wrk\r\nAccept: */*\r\n'
//! expect: 20 37 50 -1 50
console.log(
  `${head.indexOf('\r\n')} ${head.indexOf('\r\n', 21)} ${head.lastIndexOf('\r\n')} ${head.indexOf('\r\n\r\n')} ${head.lastIndexOf('\r\n', 50)}`
)
const accented = 'café, naïve, café'
//! expect: 6 13 3 -1 0
console.log(
  `${accented.indexOf('naïve')} ${accented.lastIndexOf('café')} ${accented.indexOf('é')} ${accented.indexOf('x')} ${accented.indexOf('')}`
)
const astral = 'a\u{1F600}b, a\u{1F600}b'
//! expect: 3 9 9
console.log(`${astral.indexOf('b')} ${astral.lastIndexOf('b')} ${astral.indexOf('b', 4)}`)
//! expect: true true false true true false
console.log(
  `${'\u{1F600}x'.startsWith('\uD83D')} ${'x\u{1F600}'.endsWith('\uDE00')} ${'café'.startsWith('cafe')} ${'café'.startsWith('caf')} ${'café'.endsWith('é')} ${'ab'.startsWith('abc')}`
)

// An unanchored search skips every start no opening atom can match: one
// opening byte (`/`), an opening class, a match on the last byte, none at all,
// and an empty input.
//! expect: true true false false true false
console.log(
  `${dots.test('/a/b/../c')} ${dots.test('/a/.')} ${dots.test('/a/b.c')} ${dots.test('')} ${/[xy]z/.test('aaaaayz')} ${/[xy]z|qq/.test('aaaz')}`
)
//! expect: true false true
console.log(`${/(?:ab|cd)e/.test('zzcde')} ${/(?:ab|cd)e/.test('zzade')} ${/a?b/.test('ccb')}`)
