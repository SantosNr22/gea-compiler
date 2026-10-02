//! expect: date regexp plain 3 7
//! emitted-has: const gea::Value& gea_arg_0

// A type guard only asks the box a question, so a caller's private `any`
// slot is lent to it as a const reference instead of being copied (a retain,
// and a cycle-candidate buffering on release) once per guard.
function isDate(value: any): boolean {
  return value instanceof Date || Object.prototype.toString.call(value) === '[object Date]'
}
function isRegExp(value: any): boolean {
  return value instanceof RegExp || Object.prototype.toString.call(value) === '[object RegExp]'
}
function classify(value: any): string {
  if (typeof value !== 'object' || value === null) return 'other'
  if (isDate(value)) return 'date'
  if (isRegExp(value)) return 'regexp'
  return 'plain'
}
// A body that STORES through the box must keep owning its formal.
function stamp(target: any): number {
  target.seen = 7
  return target.seen
}
let slot: any = new Date(0)
const first = classify(slot)
slot = /x/
const second = classify(slot)
slot = { a: 1 }
const third = classify(slot)
console.log(first, second, third, 3, stamp(slot))
