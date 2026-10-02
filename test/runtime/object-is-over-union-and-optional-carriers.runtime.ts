// Object.is compares VALUES: a union or optional carrier holding `0` is the
// same value as a number `0`. Deciding by the carriers' spellings folded every
// such comparison to `false`.
const mixed: (string | number)[] = [0, 'a', -0, NaN]
console.log(Object.is(mixed[0], 0), Object.is(mixed[1], 'a'), Object.is(mixed[2], 0), Object.is(mixed[2], -0), Object.is(mixed[3], NaN))
console.log(Object.is(mixed[0], 'a'), Object.is(mixed[1], mixed[1]), Object.is(mixed[0], mixed[2]))
const maybe = (flag: boolean): number | undefined => (flag ? 5 : undefined)
console.log(Object.is(maybe(true), 5), Object.is(maybe(false), undefined), Object.is(maybe(false), 5), Object.is(maybe(true), undefined))
class Box {}
const box = new Box()
const boxes: (Box | null)[] = [box, null]
console.log(Object.is(boxes[0], box), Object.is(boxes[1], null), Object.is(boxes[0], null), Object.is(boxes[1], box))
//! expect: true true false true true
//! expect: false true false
//! expect: true true false false
//! expect: true true false false
export {}
