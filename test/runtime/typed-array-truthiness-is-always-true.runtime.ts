// memory-pager's `Pager.prototype.set` (node_modules/memory-pager/index.js:86)
// tests `if (!buf || ...)` over a Uint8Array. Every typed array is an Object,
// so ToBoolean is true even for a zero-length one; so is an ArrayBuffer, a
// DataView and a Promise.
function describe(buf: Uint8Array | undefined): string {
  if (!buf) return 'none'
  return 'len' + buf.length
}

const empty = new Uint8Array(0)
const buffer = new ArrayBuffer(0)
const view = new DataView(new ArrayBuffer(2))
const pending = Promise.resolve(1)
//! expect: len0 len3 none true true true true
console.log(
  describe(empty) +
    ' ' +
    describe(new Uint8Array(3)) +
    ' ' +
    describe(undefined) +
    ' ' +
    !!empty +
    ' ' +
    !!buffer +
    ' ' +
    !!view +
    ' ' +
    !!pending
)
