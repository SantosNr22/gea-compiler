// `value instanceof RegExp` over an `unknown` narrows `value` to the native
// pattern carrier, so `test`/`exec`/`source`/`flags` resolve statically on
// the native RegExp instead of reading a box whose methods threw
// "not implemented". `lastIndex` advancing on the global pattern, and being
// seen through the original afterwards, shows the narrowed value is the
// original object, not a copy.
function probe(value: unknown): string {
  if (value instanceof RegExp) {
    const tested = value.test('abc')
    const hit = value.exec('xx abc abd')
    const first = hit === null ? 'none' : `${hit[0]}@${hit.index}`
    return `${value.source} ${value.flags} ${tested} ${first} ${value.lastIndex}`
  }
  return 'not a pattern'
}
const pattern = /ab[cd]/g
const held: unknown[] = []
held.push(pattern)
held.push(42)
console.log(probe(held[0]))
console.log(probe(held[1]))
console.log(`original lastIndex ${pattern.lastIndex}`)
//! expect: ab[cd] g true abc@3 6
//! expect: not a pattern
//! expect: original lastIndex 6
//! emitted-lacks: getProperty(gea::PropertyKey::string("exec")
//! emitted-lacks: getProperty(gea::PropertyKey::string("source")
export {}
