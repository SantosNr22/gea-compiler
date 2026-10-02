// A narrowing a guard proved keeps the unchecked arm read: the `instanceof`
// else-branch has already excluded the other arm, so the load is a bare
// `get<k>()` with no discriminant dispatch spent on it. Only an `as` assertion,
// which proves nothing, dispatches on the live arm
// (`asserted-union-arm-is-checked-not-read-unchecked`).
function describe(value: Uint8Array | Error): string {
  if (value instanceof Error) return 'error arm'
  return 'bytes ' + value.length
}
console.log(describe(new Uint8Array(3)) + ',' + describe(new Error('x')))
//! expect: bytes 3,error arm
//! emitted-has: = gea_arg_0.get<0>();
