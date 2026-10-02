// ArrayBuffer identity and byte-sharing, pinned across the line the native
// runtime's storage now splits on: `gea::ArrayBuffer` (gea_runtime.h) keeps a
// buffer of 64 bytes or fewer INLINE in its own `Ref` block and falls back to
// a `std::vector<uint8_t>` past that -- an implementation split JavaScript
// itself draws no such line for. Every aliasing guarantee below (`.buffer`
// identity, a typed-array or `DataView` sharing the same bytes, `subarray`
// sharing and `slice` NOT sharing) must hold identically under 64 bytes, over
// it, and across a `TextEncoder.encode` that starts empty and grows past it.

const small = new ArrayBuffer(8)
const smallBytes = new Uint8Array(small)
const smallWords = new Uint32Array(small)
smallBytes[0] = 1
console.log(smallWords[0], small === smallBytes.buffer, small === smallWords.buffer)

const view = new DataView(small)
view.setUint8(4, 42)
console.log(smallBytes[4])

const large = new ArrayBuffer(200)
const largeBytes = new Uint8Array(large)
largeBytes[0] = 9
largeBytes[199] = 7
console.log(largeBytes[0], largeBytes[199], large.byteLength)

// `.slice()` copies -- never shares -- on both sides of the inline/heap line.
const sliced = large.slice(0, 4)
const slicedBytes = new Uint8Array(sliced)
slicedBytes[0] = 111
console.log(largeBytes[0], slicedBytes[0], (sliced as unknown) === (large as unknown))

const smallSliceSource = new ArrayBuffer(4)
const smallSliceBytes = new Uint8Array(smallSliceSource)
smallSliceBytes[0] = 3
const smallSlice = smallSliceSource.slice(0, 4)
console.log(new Uint8Array(smallSlice)[0], (smallSlice as unknown) === (smallSliceSource as unknown))

// `.subarray()` shares -- the family's other half.
const sub = largeBytes.subarray(0, 4)
sub[0] = 55
console.log(largeBytes[0])

// A fresh `TextEncoder` result starts inline (short input) and moves to the
// heap fallback (long input); both must report the byte length they encoded.
const encoder = new TextEncoder()
const short = encoder.encode('hi')
const long = encoder.encode('a message long enough to spill past the sixty four byte inline capacity for sure')
console.log(short.length, long.length, short.buffer.byteLength, long.buffer.byteLength)

//! expect: 1 true true
//! expect: 42
//! expect: 9 7 200
//! expect: 9 111 false
//! expect: 3 false
//! expect: 55
//! expect: 2 80 2 80
