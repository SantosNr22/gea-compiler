// A document's entries live in geometric chunks (4, 8, 16, ... entries) that
// are allocated on demand and freed with the table. The table records which
// chunks exist so a table that never grew -- a view, an empty document -- frees
// none; this walks every size class the store has: empty, inside the first
// chunk, across several chunks, past the geometric capacity into the tail, and
// back down through deletion, a copy and a move.

interface Doc {
  [key: string]: any
}

function build(count: number): Doc {
  const doc: Doc = {}
  for (let index = 0; index < count; index++) doc['k' + index] = index
  return doc
}

function sum(doc: Doc): number {
  let total = 0
  for (const key of Object.keys(doc)) total += doc[key]
  return total
}

const sizes = [0, 1, 4, 5, 12, 13, 28, 29, 60, 61, 124, 125, 1020, 1021, 1100, 2100]
const out: string[] = []
for (const size of sizes) {
  const doc = build(size)
  const copy: Doc = { ...doc }
  const keys = Object.keys(doc).length
  // Deleting the first key re-lays the table out; the copy must not notice.
  if (size > 0) delete doc['k0']
  out.push(`${size}:${keys}:${Object.keys(copy).length}:${sum(copy)}:${sum(doc)}`)
}
//! expect: 0:0:0:0:0 1:1:1:0:0 4:4:4:6:6 5:5:5:10:10 12:12:12:66:66 13:13:13:78:78 28:28:28:378:378 29:29:29:406:406 60:60:60:1770:1770 61:61:61:1830:1830 124:124:124:7626:7626 125:125:125:7750:7750 1020:1020:1020:519690:519690 1021:1021:1021:520710:520710 1100:1100:1100:604450:604450 2100:2100:2100:2203950:2203950
console.log(out.join(' '))

// A table that grows, empties by deleting every key, and grows again reuses
// nothing it freed.
const churn: Doc = {}
for (let round = 0; round < 3; round++) {
  for (let index = 0; index < 50; index++) churn['r' + round + 'k' + index] = index
  for (const key of Object.keys(churn)) delete churn[key]
}
churn['last'] = 1
//! expect: last=1 count=1
console.log(`last=${churn['last']} count=${Object.keys(churn).length}`)
