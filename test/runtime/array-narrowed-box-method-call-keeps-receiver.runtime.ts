// `Array.isArray(value)` over an `any`/`unknown` leaves the value a box but
// types `value.map` as `Array.prototype.map`'s receiver-free signature.
// Called as that detached callable, `map` ran with no `this` ("Cannot read
// properties of undefined"). A member read off the box stays the box's own
// and the call hands the receiver back; mutation through it reaches the
// caller's array.
function visit(value: any): string {
  if (Array.isArray(value)) return `[${value.map((x: any) => visit(x)).join(',')}]`
  return String(value)
}
function show(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((element: unknown) => show(element)).join(',')}]`
  return String(value)
}
const nums: number[] = [4, 5]
const other: any = [nums, 'a', [nums]]
console.log(visit(other), show(other))
function grow(value: unknown): number {
  if (Array.isArray(value)) {
    value.push(9)
    value[0] = 7
    value.sort()
    return value.length
  }
  return -1
}
console.log(grow(nums), nums.join(','))
//! expect: [[4,5],a,[[4,5]]] [[4,5],a,[[4,5]]]
//! expect: 3 5,7,9
export {}
