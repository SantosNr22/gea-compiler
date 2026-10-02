// ECMA-262 25.5.2.5 SerializeJSONProperty: a tuple is an Array exotic object,
// so JSON.stringify writes it through SerializeJSONArray -- `[...]` in index
// order, an undefined/function/absent element as `null` -- never as the
// `{"0":..,"1":..}` an ordinary object with index keys would print. The
// compiler holds a fixed tuple as a positional record; that representation
// must not leak into what JSON sees.

//! expect: A [["p",1],["q",2]]
console.log('A', JSON.stringify(Object.entries({ p: 1, q: 2 })))

const pair: [string, number] = ['x', 7]
//! expect: B ["x",7]
console.log('B', JSON.stringify(pair))

const nested: [[number, string], [boolean, [number, number]]] = [
  [1, 'a'],
  [true, [2, 3]]
]
//! expect: C [[1,"a"],[true,[2,3]]]
console.log('C', JSON.stringify(nested))

const holder = { name: 'h', point: [4, 5] as [number, number], tags: ['t', 1] as [string, number] }
//! expect: D {"name":"h","point":[4,5],"tags":["t",1]}
console.log('D', JSON.stringify(holder))

const withOptional: [string, number?] = ['only']
//! expect: E ["only"]
console.log('E', JSON.stringify(withOptional))
const filledOptional: [string, number?] = ['both', 3]
//! expect: F ["both",3]
console.log('F', JSON.stringify(filledOptional))

const withUndefined: [string, number | undefined, boolean] = ['u', undefined, false]
//! expect: G ["u",null,false]
console.log('G', JSON.stringify(withUndefined))

const rows: [string, number][] = [
  ['r', 1],
  ['s', 2]
]
//! expect: H [["r",1],["s",2]]
console.log('H', JSON.stringify(rows))
//! expect: I [["p",[1,2]]]
console.log('I', JSON.stringify(Object.entries({ p: [1, 2] })))

const boxed: any = pair
//! expect: J ["x",7]
console.log('J', JSON.stringify(boxed))

// JSON.parse into a tuple reads the array positionally -- the mirror of the
// writer, so a tuple round-trips.
const back = JSON.parse('["y",9]') as [string, number]
//! expect: K y 9
console.log('K', back[0], back[1])
const backRows = JSON.parse(JSON.stringify(rows)) as [string, number][]
//! expect: L s 2 2
console.log('L', backRows[1]![0], backRows[1]![1], backRows.length)
