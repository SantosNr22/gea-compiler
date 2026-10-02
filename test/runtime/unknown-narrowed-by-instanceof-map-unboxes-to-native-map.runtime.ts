// `value instanceof Map` over an `unknown` narrows `value` to a native Map of
// dynamic keys and values (its element types are unknown), sharing identity:
// an entry set through the narrowed binding is visible through the original.
function bump(value: unknown): string {
  if (value instanceof Map) {
    const before = value.size
    value.set('b', 2)
    return `${before} ${value.get('a')} ${value.get('b')} ${value.size} ${value.has('b')}`
  }
  return 'not a map'
}
const original = new Map<string, number>()
original.set('a', 1)
const held: unknown[] = []
held.push(original)
held.push('text')
console.log(bump(held[0]))
console.log(bump(held[1]))
console.log(`original ${original.size} ${original.get('b')}`)
//! expect: 1 1 2 2 true
//! expect: not a map
//! expect: original 2 2
//! emitted-lacks: getProperty(gea::PropertyKey::string("size")
//! emitted-lacks: getProperty(gea::PropertyKey::string("set")
export {}
