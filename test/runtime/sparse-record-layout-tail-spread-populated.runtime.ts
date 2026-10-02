// A large, mostly-optional record (`records.ts`'s `tailFieldsOf`) whose
// STRING-payload optional fields move behind ONE lazily-allocated
// `gea::RecordTail` block, populated with several of those fields set --
// the case `gea::RecordTail`'s copy constructor (gea_runtime.h) exists for:
// `{ ...source }` must deep-copy the whole tail block once, not alias it,
// so a later write to the copy's tail field never moves the source's.
interface WithTail {
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

const source: WithTail = {
  id: 1,
  active: true,
  count: 3,
  s1: 'alpha',
  s4: 'delta',
  s9: 'iota',
  n2: 20
}

const spread1 = { ...source }
console.log('spread1:', spread1.s1, spread1.s4, spread1.s9, spread1.n2, spread1.id)

// Mutate the SOURCE's tail fields after the copy: the copy's tail block must
// be its own allocation, unaffected by a later write to the source's.
source.s1 = 'alpha-changed'
source.s9 = undefined
console.log('source-after-mutation:', source.s1, source.s9)
console.log('spread1-still:', spread1.s1, spread1.s9)

// A second, independent spread off the (now mutated) source, plus a further
// tail write on ITS OWN copy, to prove the two copies do not alias each
// other's tail either.
const spread2 = { ...source }
spread2.s1 = 'alpha-from-spread2'
console.log('spread2:', spread2.s1, spread2.s9)
console.log('source-unaffected-by-spread2:', source.s1)

console.log('spread1-json:', JSON.stringify(spread1))

//! expect: spread1: alpha delta iota 20 1
//! expect: source-after-mutation: alpha-changed undefined
//! expect: spread1-still: alpha iota
//! expect: spread2: alpha-from-spread2 undefined
//! expect: source-unaffected-by-spread2: alpha-changed
//! expect: spread1-json: {"id":1,"active":true,"count":3,"s1":"alpha","s4":"delta","s9":"iota","n2":20}
//! emitted-has: gea::RecordTail<
export {}
