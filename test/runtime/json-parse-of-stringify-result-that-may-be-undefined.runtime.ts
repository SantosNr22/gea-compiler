// `JSON.stringify` is typed `string` but answers `undefined` for a value JSON
// cannot represent, so its native carrier is optional(string). `JSON.parse`
// of it is ToString(undefined) = "undefined", a SyntaxError -- not a C++
// conversion error from `Optional<std::string>` to `std::string`.
function roundTrip(value: any): { a: number } {
  return JSON.parse(JSON.stringify(value)) as { a: number }
}

const ok = roundTrip({ a: 3 })
let threw = false
try {
  roundTrip(undefined)
} catch (error) {
  threw = error instanceof SyntaxError
}
console.log(ok.a, threw)
//! expect: 3 true
