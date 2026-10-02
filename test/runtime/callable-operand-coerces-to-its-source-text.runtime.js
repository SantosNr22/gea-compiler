// @ts-nocheck
// `value || 'plain'` over an omitted-or-function argument is a string or a
// function. `chosen === 0` can hold for neither, so `1 / chosen` behind it is
// code that never runs (`ir/proven-branches.ts`'s disjoint strict equality);
// `'got ' + chosen` over the function arm is `Function.prototype.toString`,
// the literal's own source text (`emit-tostring.ts`). The test262 harness's
// `isWritable`/`isSameValue` pair is the same shape.
function describe(value) {
  var chosen = value || 'plain'
  if (chosen === 0) return 'zero ' + 1 / chosen
  if (chosen !== 0 && typeof chosen === 'string') return 'got ' + chosen
  return 'fn ' + chosen
}
console.log(describe())
// The expectation is the function literal's own source text, so the literal must stay on one line.
// prettier-ignore
console.log(describe(function named() { return 1 }))
console.log(`${describe(() => 2)}`)
//! expect: got plain
//! expect: fn function named() { return 1 }
//! expect: fn () => 2
