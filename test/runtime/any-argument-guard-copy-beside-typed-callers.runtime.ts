// A guard called with both typed and `any` arguments: the typed callers keep
// the native copy (a tagged-union parameter), the unchecked callers reach the
// copy whose tested parameter is dynamic. The guard also calls itself, and a
// caller outside the guard's own file-order (above its declaration) is
// redirected as well.
type Shape = number | { kind: 'box'; inner: Shape }

const early = (value: any): boolean => isBox(value)

function isBox(shape: Shape): shape is { kind: 'box'; inner: Shape } {
  return typeof shape === 'object' && shape !== null && shape.kind === 'box' && (typeof shape.inner === 'number' || isBox(shape.inner))
}

function describe(value: any): string {
  return isBox(value) ? 'box' : `not a box: ${JSON.stringify(value)}`
}

const typed: Shape[] = [1, { kind: 'box', inner: 2 }, { kind: 'box', inner: { kind: 'box', inner: 3 } }]
for (const shape of typed) console.log(isBox(shape))
console.log(describe([1, 2]))
console.log(describe({ kind: 'box', inner: 4 }))
console.log(describe({ kind: 'box', inner: 'x' }))
console.log(describe('box'))
console.log(early(null))
console.log(early({ kind: 'box', inner: { kind: 'box', inner: 5 } }))

//! expect: false
//! expect: true
//! expect: true
//! expect: not a box: [1,2]
//! expect: box
//! expect: not a box: {"kind":"box","inner":"x"}
//! expect: not a box: "box"
//! expect: false
//! expect: true
