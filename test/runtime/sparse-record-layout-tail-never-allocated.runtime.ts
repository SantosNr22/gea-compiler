// The same large, mostly-optional record shape as the other `RecordTail`
// tests, but this program never writes ANY string-payload optional field --
// the tail-eligible ones (`records.ts`'s `tailFieldsOf`) -- on any instance
// it builds. `gea::RecordTail::ensure()` (gea_runtime.h) is never called for
// these objects at all: `ptr_` stays null for the whole life of every one,
// which is the "typical object never allocates a tail" case the per-field
// (rather than per-struct) allocation design exists to guarantee. This is a
// correctness check on that path -- every absent tail-field read (plain,
// narrowed-optional-chained, `Object.keys`, `JSON.stringify`, spread, and a
// computed key) must answer exactly as an ordinary never-set optional field
// does, with no tail ever materializing to answer it.
interface NoTail {
  id: number
  active: boolean
  count: number
  s1?: string
  s2?: string
  s3?: string
  s4?: string
  s5?: string
  s6?: string
  s7?: string
  s8?: string
  s9?: string
  s10?: string
  s11?: string
  s12?: string
  n1?: number
  n2?: number
  n3?: number
  n4?: number
  n5?: number
  n6?: number
  n7?: number
  n8?: number
  n9?: number
  n10?: number
  n11?: number
  n12?: number
  b1?: boolean
  b2?: boolean
  b3?: boolean
  b4?: boolean
  b5?: boolean
  b6?: boolean
  b7?: boolean
  b8?: boolean
  b9?: boolean
  b10?: boolean
}

// Only inline-eligible fields (required, `number`, `boolean`) are ever set.
const plain: NoTail = { id: 1, active: true, count: 7, n1: 42, b1: true }

console.log('plain-read-absent:', plain.s1, plain.s12)
console.log('plain-read-set:', plain.n1, plain.b1)
console.log('plain-optional-chain:', plain.s1?.length, plain.s1 ?? 'fallback')
console.log('plain-keys:', Object.keys(plain).join(','))
console.log('plain-json:', JSON.stringify(plain))

const key: string = ['s', '5'].join('')
const bag = plain as unknown as Record<string, unknown>
console.log('plain-dynamic-read-absent:', bag[key])

const spread = { ...plain }
console.log('spread-read-absent:', spread.s1, spread.s12)
console.log('spread-read-set:', spread.n1, spread.b1)

//! expect: plain-read-absent: undefined undefined
//! expect: plain-read-set: 42 true
//! expect: plain-optional-chain: undefined fallback
//! expect: plain-keys: id,active,count,n1,b1
//! expect: plain-json: {"id":1,"active":true,"count":7,"n1":42,"b1":true}
//! expect: plain-dynamic-read-absent: undefined
//! expect: spread-read-absent: undefined undefined
//! expect: spread-read-set: 42 true
//! emitted-has: gea::RecordTail<
export {}
