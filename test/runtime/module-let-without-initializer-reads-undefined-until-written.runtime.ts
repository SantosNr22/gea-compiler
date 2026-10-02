//! expect: loads 1
//! expect: compress: zstd:abc zstd:def
//! expect: before: true
//! expect: count: 0 1 2
//! expect: local: 7
//! expect: lazy: 41 41
//! expect: library: missing zstd / zstd 2

// A module `let` declared without an initializer holds `undefined` until the
// first write, and the checker never proves definite assignment across
// functions. mongodb's `compression.ts` (`let zstd: ZStandard` then
// `if (!zstd) zstd = loadZstd()`) is the idiom: carried as its declared type,
// `!zstd` folds to false and the loader never runs.

interface Codec {
  readonly name: string
  encode(input: string): string
}

let codec: Codec
let loads = 0

function loadCodec(): Codec {
  loads++
  return { name: 'zstd', encode: (input: string) => `zstd:${input}` }
}

function compress(input: string): string {
  if (!codec) codec = loadCodec()
  return codec.encode(input)
}

const first = compress('abc')
const second = compress('def')
console.log(`loads ${loads}`)
console.log(`compress: ${first} ${second}`)

let label: string
function isUnset(): boolean {
  return label === undefined
}
console.log(`before: ${isUnset()}`)

let counter: number
function bump(): number {
  if (counter === undefined) counter = 0
  else counter++
  return counter
}
const a = bump()
const b = bump()
const c = bump()
console.log(`count: ${a} ${b} ${c}`)

// A write that dominates every read in the same function stays the plain type.
function local(): number {
  let x: number
  x = 7
  return x
}
console.log(`local: ${local()}`)

let answer: number
function lazy(): number {
  answer ??= 41
  return answer
}
console.log(`lazy: ${lazy()} ${lazy()}`)

// The mongodb shape exactly: the cell's declared type is itself a union, and
// the reads narrow it with `in` after the lazy load.
type Library = { kModuleError: string } | { compress(input: string): string }
let library: Library
let libraryLoads = 0
function loadLibrary(): void {
  if (!library) {
    libraryLoads++
    library = libraryLoads > 5 ? { compress: (input: string) => input } : { kModuleError: 'missing zstd' }
  }
}
function useLibrary(): string {
  loadLibrary()
  if ('kModuleError' in library) return library.kModuleError
  return library.compress('x')
}
console.log(`library: ${useLibrary()} / zstd ${useLibrary() === 'missing zstd' ? libraryLoads + 1 : 0}`)
