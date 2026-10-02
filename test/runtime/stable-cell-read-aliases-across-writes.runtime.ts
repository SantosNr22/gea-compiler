// A read of a local cell the body writes many times renders as the cell
// itself when no write can come between the read and any of its uses, and
// keeps its own copy when one can: the loop variable read per key, tested,
// used, then reassigned sees one value throughout, while a snapshot taken
// before a reassignment still holds the old object.
'use strict'
type Doc = { readonly kind: string; readonly count: number }
const docs: Doc[] = [
  { kind: 'a', count: 1 },
  { kind: 'b', count: 2 },
  { kind: 'c', count: 3 }
]
const describe = (doc: Doc): string => doc.kind + doc.count
let value: Doc | null = null
let seen = ''
for (let index = 0; index < docs.length; index += 1) {
  value = docs[index] ?? null
  const current = value
  if (current === null) continue
  seen += describe(current)
  value = { kind: current.kind.toUpperCase(), count: current.count * 10 }
  seen += describe(value) + (current === value ? '!' : '.')
}
console.log(seen)
let holder: Doc = { kind: 'first', count: 1 }
const before = holder
holder = { kind: 'second', count: 2 }
console.log(before.kind, holder.kind, before === holder)
let text = 'x'
const snapshot = text
text += 'y'
text += 'z'
console.log(snapshot, text)
let box: unknown = docs[0]
const first = box
box = docs[1]
console.log(String((first as Doc).kind), String((box as Doc).kind))
//! expect: a1A10.b2B20.c3C30.
//! expect: first second false
//! expect: x xyz
//! expect: a b
