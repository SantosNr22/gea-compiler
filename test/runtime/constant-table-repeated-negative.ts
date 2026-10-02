//! expect: sum=-1
//! emitted-has: static const double gea_table_
// A negative literal used more than once in a constant table is still a constant:
// the table's elements must not be rebound to a runtime `int` local, which a braced
// initializer of doubles rejects as a narrowing conversion.
const edges = [0, 0, -1, 0, 1, 0, -1, -1, 0, 1]
let sum = 0
for (let i = 0; i < edges.length; i++) sum += edges[i] ?? 0
console.log(`sum=${sum}`)
