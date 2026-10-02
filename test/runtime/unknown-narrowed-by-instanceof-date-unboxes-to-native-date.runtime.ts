// `value instanceof Date` over an `unknown` narrows `value` to the native
// Date carrier: the guard unboxes once, and every member read and call in the
// branch -- getters and setters alike -- resolves statically against the
// native Date, sharing identity with the boxed original. Before, the branch
// kept the box and read `toISOString` off it dynamically, through a partial,
// hand-listed Date prototype table on the box that had no setters.
function touch(value: unknown): string {
  if (value instanceof Date) {
    const before = `${value.toISOString()} ${value.getTime()} ${value.getUTCFullYear()} ${value.getUTCMonth()} ${value.getUTCDate()}`
    value.setUTCFullYear(2030)
    value.setUTCHours(7)
    return `${before} -> ${value.getUTCFullYear()} ${value.getUTCHours()}`
  }
  return 'not a date'
}
const original = new Date('2024-01-02T03:04:05.006Z')
const held: unknown[] = []
held.push(original)
held.push('text')
console.log(touch(held[0]))
console.log(touch(held[1]))
console.log(`original ${original.toISOString()}`)
//! expect: 2024-01-02T03:04:05.006Z 1704164645006 2024 0 2 -> 2030 7
//! expect: not a date
//! expect: original 2030-01-02T07:04:05.006Z
//! emitted-lacks: getProperty(gea::PropertyKey::string("toISOString")
//! emitted-lacks: getProperty(gea::PropertyKey::string("setUTCFullYear")
export {}
