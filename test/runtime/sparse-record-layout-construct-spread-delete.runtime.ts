// A record whose field count crosses `records.ts`'s sparse-layout threshold
// (over 32 fields, most of them optional) moves its non-inline optional
// fields (here, the `string` ones) behind ONE lazily-allocated `gea::RecordTail`
// block instead of storing each inline -- see `records.ts`'s `tailFieldsOf`
// and the runtime header's `RecordTail` comment. A `boolean`/`number` optional
// field stays inline regardless (`sparseFieldFitsInline`), so this program
// exercises both: `optStr*` fields live in the tail, `optNum*`/`optBool*`
// stay on the struct itself. This is the "few fields set out of many" case
// the layout exists for: construction with a handful of fields, reading a
// field that was never set, `Object.keys` order, `JSON.stringify`, `delete`,
// and a spread copy.
interface LotsOfOptions {
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

const options: LotsOfOptions = {
  id: 1,
  name: 'n',
  host: 'h',
  active: true,
  optStr1: 'hello',
  optNum3: 42,
  optBool7: true
}

// Reading a field that was never set anywhere in the program.
console.log('absent:', options.optBool12, options.optStr9)
// Reading the fields that were set.
console.log('present:', options.optStr1, options.optNum3, options.optBool7)
console.log('keys:', Object.keys(options).join(','))
console.log('json:', JSON.stringify(options))

delete options.optStr1
console.log('after-delete:', options.optStr1, 'optStr1' in options, Object.keys(options).join(','))

const copy = { ...options }
console.log('copy-keys:', Object.keys(copy).join(','))
console.log('copy-values:', copy.optNum3, copy.optBool7, copy.id, copy.name)
// The copy is independent storage: mutating the source must not move the copy.
options.optNum3 = 99
console.log('independent:', options.optNum3, copy.optNum3)

//! expect: absent: undefined undefined
//! expect: present: hello 42 true
//! expect: keys: id,name,host,active,optStr1,optNum3,optBool7
//! expect: json: {"id":1,"name":"n","host":"h","active":true,"optStr1":"hello","optNum3":42,"optBool7":true}
//! expect: after-delete: undefined false id,name,host,active,optNum3,optBool7
//! expect: copy-keys: id,name,host,active,optNum3,optBool7
//! expect: copy-values: 42 true 1 n
//! expect: independent: 99 42
//! emitted-has: gea::RecordTail<
export {}
