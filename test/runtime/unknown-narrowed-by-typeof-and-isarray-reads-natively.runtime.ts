// `typeof value === 'string'`/`'number'` over an `unknown` narrow `value` to
// its native carrier in the guarded branch, so the string's `length` and
// `toUpperCase` and the number's `toFixed` are static, not property reads on
// the box. `Array.isArray(value)` deliberately keeps the box: the elements
// are unknown, and a boxed `number[]` is no `Array<Value>` a narrowed view
// could share identity with, so its `length` stays the box's own [[Get]].
function describe(value: unknown): string {
  if (typeof value === 'string') return `string ${value.length} ${value.toUpperCase()}`
  if (typeof value === 'number') return `number ${value.toFixed(2)}`
  if (Array.isArray(value)) return `array ${value.length} ${String(value[0])}`
  return 'other'
}
const held: unknown[] = []
held.push('abc')
held.push(1.5)
const inner: unknown[] = []
inner.push('x')
inner.push(2)
held.push(inner)
held.push(true)
for (const value of held) console.log(describe(value))
//! expect: string 3 ABC
//! expect: number 1.50
//! expect: array 2 x
//! expect: other
//! emitted-lacks: getProperty(gea::PropertyKey::string("toUpperCase")
//! emitted-lacks: getProperty(gea::PropertyKey::string("toFixed")
export {}
