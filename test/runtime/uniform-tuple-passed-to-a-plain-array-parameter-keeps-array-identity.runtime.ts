// The same widening as the sibling `...widened-to-a-plain-array...` test, one
// call deep: `mutate`'s own parameter is declared `number[]`, a DIFFERENT
// structural type than the tuple argument's own, so the invocation exemption
// for "a call to one exact function of this program" (`value-records.ts`)
// must not exempt this argument on the assumption that the callee compiles
// against the same carrier -- it does not. `push`ing through the parameter
// must still grow the caller's own tuple.
type Pair5 = [number, number, number, number, number]

function mutate(values: number[]): void {
  values.push(6)
}

const t: Pair5 = [1, 2, 3, 4, 5]
mutate(t)

console.log('t-length=' + t.length)

//! expect: t-length=6
