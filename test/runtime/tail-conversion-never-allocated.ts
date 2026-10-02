// A record-to-record CONVERSION/spread from a source whose tail-eligible
// fields (the `optStr*` ones -- see `sparse-record-layout-construct-spread-delete.runtime.ts`
// for why strings, not `optNum*`/`optBool*`, are the ones `records.ts` moves
// behind `gea::RecordTail`) were never set must not force the destination's
// tail to allocate just to decide that every one of them is absent. This
// program builds the destination through a FUNCTION boundary (`widen`, a
// parameter/return round trip -- a distinct conversion path from the plain
// object-literal spread the sibling test already covers) and then drives
// every read shape a tail field can be observed through: a plain property
// read, optional chaining, a computed (`obj[key]`) read over a variable key,
// `Object.keys`, `JSON.stringify`, and a SECOND spread from that already-tail-
// eligible (but still tail-unallocated) destination. `test/native-tail-conversion-never-allocated.mjs`
// compiles this same fixture directly and asserts, via the runtime header's
// per-type allocation counter, that the tail struct this shape generates was
// never actually allocated across the whole run -- this file's own `//!`
// lines are the functional half (every one of those reads answers exactly as
// an ordinary absent optional field would); the allocation half needs a
// counter no plain `.runtime.ts` program can read.
interface WideOptions {
  id: number
  name: string
  host: string
  active: boolean
  optStr1?: string
  optStr2?: string
  optStr3?: string
  optStr4?: string
  optStr5?: string
  optStr6?: string
  optStr7?: string
  optStr8?: string
  optStr9?: string
  optStr10?: string
  optStr11?: string
  optStr12?: string
  optNum1?: number
  optNum2?: number
  optNum3?: number
  optNum4?: number
  optNum5?: number
  optNum6?: number
  optNum7?: number
  optNum8?: number
  optNum9?: number
  optNum10?: number
  optNum11?: number
  optNum12?: number
  optBool1?: boolean
  optBool2?: boolean
  optBool3?: boolean
  optBool4?: boolean
  optBool5?: boolean
  optBool6?: boolean
  optBool7?: boolean
  optBool8?: boolean
  optBool9?: boolean
  optBool10?: boolean
  optBool11?: boolean
  optBool12?: boolean
}

function widen(source: WideOptions): WideOptions {
  return { ...source }
}

// No `optStr*` field is ever written, anywhere in this program.
const source: WideOptions = { id: 1, name: 'n', host: 'h', active: true, optNum3: 42, optBool7: true }

const dest = widen(source)
console.log('dest-read-absent:', dest.optStr1, dest.optStr12)
console.log('dest-optional-chain:', dest.optStr5?.length, dest.optStr5 ?? 'fallback')
console.log('dest-read-set:', dest.optNum3, dest.optBool7)

const key: string = ['optStr', '9'].join('')
const bag = dest as unknown as Record<string, unknown>
console.log('dest-dynamic-read-absent:', bag[key])

console.log('dest-keys:', Object.keys(dest).join(','))
console.log('dest-json:', JSON.stringify(dest))

const dest2 = { ...dest }
console.log('dest2-read-absent:', dest2.optStr1, dest2.optStr12)
console.log('dest2-keys:', Object.keys(dest2).join(','))
console.log('dest2-json:', JSON.stringify(dest2))

//! expect: dest-read-absent: undefined undefined
//! expect: dest-optional-chain: undefined fallback
//! expect: dest-read-set: 42 true
//! expect: dest-dynamic-read-absent: undefined
//! expect: dest-keys: id,name,host,active,optNum3,optBool7
//! expect: dest-json: {"id":1,"name":"n","host":"h","active":true,"optNum3":42,"optBool7":true}
//! expect: dest2-read-absent: undefined undefined
//! expect: dest2-keys: id,name,host,active,optNum3,optBool7
//! expect: dest2-json: {"id":1,"name":"n","host":"h","active":true,"optNum3":42,"optBool7":true}
//! emitted-has: gea::RecordTail<
export {}
