// `(cond ? items[0] : items) as S[]` where `items: unknown[]`: the conditional's
// join is `dynamic | unknown[]`, and the assertion proves nothing about which
// arm is live. Reading the one arm that converts unconditionally aborted on the
// other ("an assertion out of a dynamic value to ArrayObject expected an
// Array"). Each arm that can carry the value converts: the dynamic element
// unboxes, the `unknown[]` converts element-wise with a TypeError on a mismatch.
class S {
  constructor(public n: number) {}
}
function pick(items: unknown[]): number {
  const streams: S[] = (items.length === 1 && Array.isArray(items[0]) ? items[0] : items) as S[]
  return streams.length
}
const a: unknown[] = []
a.push(new S(1))
a.push(new S(2))
a.push(new S(3))
console.log('flat=' + pick(a))
const inner: unknown[] = []
inner.push(new S(4))
inner.push(new S(5))
const wrapped: unknown[] = []
wrapped.push(inner)
console.log('wrapped=' + pick(wrapped))
const wrong: unknown[] = []
wrong.push('x')
wrong.push('y')
try {
  console.log('wrong=' + pick(wrong))
} catch (error) {
  console.log('caught=' + (error instanceof TypeError))
}
// The element-wise rebuild is a copy, so it is taken only where nothing in the
// body writes: a body that pushes through the asserted array and reads the
// original would silently diverge from Node (4), so it fails closed instead.
function writeThrough(items: unknown[]): number {
  const streams: S[] = (items.length === 1 && Array.isArray(items[0]) ? items[0] : items) as S[]
  streams.push(new S(9))
  return items.length
}
try {
  console.log('aliased=' + writeThrough(a))
} catch (error) {
  console.log('write=' + (error instanceof TypeError ? 'TypeError' : 'other'))
}
//! expect: flat=3
//! expect: wrapped=2
//! expect: caught=true
//! expect: write=TypeError
