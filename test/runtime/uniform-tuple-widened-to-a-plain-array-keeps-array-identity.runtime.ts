// A closed tuple is structurally assignable to the plain array type its
// elements share -- `const widened: number[] = t` -- and JS gives `t` and
// `widened` the SAME array, so `widened.push(6)` grows `t` too. A by-value
// tuple copy would leave `t` at its original length while `widened` grew,
// which is wrong. `value-records.ts`'s `binding` rule disqualifies a tuple
// widened into a plain (non-tuple) array-typed slot for exactly this reason,
// so this tuple keeps its `array-object` carrier and the alias stays real.
type Pair5 = [number, number, number, number, number]

const t: Pair5 = [1, 2, 3, 4, 5]
const widened: number[] = t
widened.push(6)

console.log('t-length=' + t.length)
console.log('widened-length=' + widened.length)

//! expect: t-length=6
//! expect: widened-length=6
