//! expect: {"second":2,"first":"kept"}
//! expect: {"first":"kept","second":2}
interface Pair {
  first: string
  second: number
}
const reordered = JSON.parse('{"second":2,"first":"kept"}') as Pair
console.log(JSON.stringify(reordered))
const ordered = JSON.parse('{"first":"kept","second":2}') as Pair
console.log(JSON.stringify(ordered))
