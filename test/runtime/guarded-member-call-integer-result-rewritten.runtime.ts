// The same guarded integer read as `guarded-member-call-integer-result`, with
// the member rewritten to a callable that answers a fraction. The census read
// the candidate, not this one, so the checked read stops the program rather
// than rounding 1.5 into the integer cursor.
//! expect-abort
//! expect: before 4

interface Codec {
  readLength(bytes: Uint8Array, at: number): number
}

const Codec: Codec = {
  readLength(bytes: Uint8Array, at: number): number {
    return bytes[at]! | (bytes[at + 1]! << 8)
  }
}

function walk(bytes: Uint8Array): number {
  let index = 0
  while (index + 2 <= bytes.length) index += 2 + Codec.readLength(bytes, index)
  return index
}

console.log(`before ${walk(new Uint8Array([2, 0, 7, 7]))}`)
Codec.readLength = (_bytes: Uint8Array, _at: number): number => 1.5
console.log(`after ${walk(new Uint8Array([2, 0, 7, 7]))}`)
