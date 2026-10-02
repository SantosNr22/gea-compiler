// ONE GENERIC `Iterable<T>` PARAMETER, CALLED WITH A SET AND WITH ARRAYS.
//
// mongodb's `shuffle<T>(sequence: Iterable<T>, limit = 0): Array<T>`
// (`utils.ts`) copies its input with `Array.from(sequence)`. The SDAM code
// calls it with a `Set<string>` of host names (`topology_description.ts`), a
// `HostAddress[]` seed list and a `ServerDescription[]` (`topology.ts`). Each
// instantiation reads its own concrete iterable; no single record layout for
// the `Iterable` protocol describes all three.

class Address {
  constructor(readonly host: string) {}
}

function firstN<T>(sequence: Iterable<T>, limit = 0): Array<T> {
  const items = Array.from(sequence)
  return limit === 0 ? items : items.slice(0, limit)
}

const names = new Set<string>(['a', 'b', 'c'])
const addresses = [new Address('x'), new Address('y')]
const numbers = [3, 1, 2]

//! expect: names=a,b
console.log(`names=${firstN(names, 2).join(',')}`)
//! expect: addresses=x,y
console.log(
  `addresses=${firstN(addresses)
    .map((a) => a.host)
    .join(',')}`
)
//! expect: numbers=3
console.log(`numbers=${firstN(numbers, 1).join(',')}`)
