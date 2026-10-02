// The homogeneous counterpart of `closed-tuple-boxed-into-any-is-an-array`
// (that test's tuple is heterogeneous, `[string, number]`, so it never
// reached this file's new by-value path at all): a tuple erased into `any`
// crosses a dynamic boundary this compiler cannot see through, which is one
// of the three conditions `value-records.ts` requires -- so it keeps
// answering `Array.isArray`, `.length` and its indexed elements as a real
// Array must, and the widening below is what a naive by-value carrier would
// get wrong (it would never be observed as an "Array" boxed into `any` at
// all, or would drop identity/mutation it needs to keep the moment it flows
// back out of the boundary).
type Pair5 = [number, number, number, number, number]

function isArrayLike(value: any): boolean {
  return Array.isArray(value)
}
function describe(value: any): string {
  return `${value.length}:${value[0]}:${value[4]}`
}

const t: Pair5 = [10, 20, 30, 40, 50]
console.log('is-array=' + isArrayLike(t))
console.log('describe=' + describe(t))

//! expect: is-array=true
//! expect: describe=5:10:50
