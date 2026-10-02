// A record large and optional-heavy enough for `RecordTail` (records.ts's
// `tailFieldsOf`) rebuilt from a dynamic value: `gea_from_dynamic_*`
// (emit-narrowing.ts) used to fill the struct positionally, which no longer
// matches a layout whose string fields moved behind the tail, so it now
// stores present fields by name.
interface Wide {
  id: number
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
  s13?: string
  s14?: string
  s15?: string
  s16?: string
  s17?: string
  s18?: string
  s19?: string
  s20?: string
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
  n13?: number
  n14?: number
  n15?: number
  n16?: number
  n17?: number
  n18?: number
  n19?: number
  n20?: number
}

const parsed = JSON.parse('{"id":7,"s3":"three","s17":"seventeen","n2":2}') as Wide
console.log(parsed.id, parsed.s3, parsed.s17, parsed.n2, parsed.s1 === undefined, parsed.n20 === undefined)
console.log(Object.keys(parsed).join(','))
parsed.s3 = 'tri'
console.log(JSON.stringify(parsed))

//! expect: 7 three seventeen 2 true true
//! expect: id,s3,s17,n2
//! expect: {"id":7,"s3":"tri","s17":"seventeen","n2":2}
