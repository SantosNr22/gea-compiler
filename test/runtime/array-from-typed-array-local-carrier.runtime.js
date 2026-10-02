// `Array.from(buf)` where every caller hands `buf` a `Uint8Array`: the census
// binds the parameter, but the checker instantiated `from<T>(ArrayLike<T>)`
// at `any` and typed the call and the `list` local `any[]`. The renderer
// builds the copy from the source's own carrier -- an `ArrayObject<double>`
// -- so the call has to publish `number[]` too, and the local with it:
// otherwise the copy lands in a boxed `ArrayObject<gea::Value>` local and
// clang rejects the assignment.
function bytes(buf) {
  var list = Array.from(buf)
  list.push(list.length)
  return list.join(',') + ' ' + list.length
}
console.log(bytes(new Uint8Array([1, 2, 3])), bytes(new Uint8Array([250, 9])))
//! expect: 1,2,3,3 4 250,9,2 3
