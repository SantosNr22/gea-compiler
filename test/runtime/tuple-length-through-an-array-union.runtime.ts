// `.length` of a tuple read through a union with an array arm: the tuple
// arm's length is its element count, stated by its type.
type Pair = readonly [string, number]
const pair: Pair = ['a', 1]
const lengthOf = (value: Pair | ReadonlyArray<string>): number => value.length
console.log(pair.length, lengthOf(pair), lengthOf(['x', 'y', 'z']))

//! expect: 2 2 3
