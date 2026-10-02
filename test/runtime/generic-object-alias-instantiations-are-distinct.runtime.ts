// Two instantiations of one generic object-literal alias are two layouts:
// `Cell<string>` holds a string and `Cell<number>` a number. The alias's own
// anchor must key on its alias type arguments, since the anonymous object type
// it names carries none of its own.
type Cell<T> = { value: T }

const a: Cell<string> = { value: 'x' }
const b: Cell<number> = { value: 2 }
const cells: Cell<number>[] = [b, { value: 3 }]
console.log(a.value, b.value + 1, cells.length)

//! expect: x 3 2
