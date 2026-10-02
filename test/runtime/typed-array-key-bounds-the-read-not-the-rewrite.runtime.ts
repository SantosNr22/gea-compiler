// An element read keyed by `v` bounds `v`, not the cell `v` was read from once
// that cell has been rewritten. Here the cell jumps past 2^53 between the read
// and the access, so it must keep the double that rounds the jump, as JS does.
//! expect: 9007199254740992 7 9007199254740996
//! expect: 3 11

function jump(bytes: Uint8Array): string {
  let i = 0
  const v = i
  i = v + 9007199254740993
  const first = bytes[v]!
  i = i + 3
  return `${i - 3} ${first} ${i}`
}

function stepped(bytes: Uint8Array): string {
  let i = 0
  let total = 0
  while (i < 3) total += bytes[i++]!
  return `${i} ${total}`
}

const bytes = new Uint8Array([7, 3, 1])
console.log(jump(bytes))
console.log(stepped(bytes))
