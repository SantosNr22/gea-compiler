// A function stating `: string` whose `return` only READS an untyped local
// inside a template: the stated return says what the template produces, not
// what the local holds. Taking it as the local's type bound `value` to a
// string cell while `JSON.parse` hands back a number.
//! expect: value=3
//! expect: value=true
//! expect: value=text

function describe(json: string): string {
  const value = JSON.parse(json)
  return `value=${value}`
}

console.log(describe('3'))
console.log(describe('true'))
console.log(describe('"text"'))
