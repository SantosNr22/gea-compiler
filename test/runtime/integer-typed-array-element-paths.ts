//! expect: pixels=7 9 0 255 65535 1
//! expect: wrapped=255 0 128 127 -128 -1 65535 4294967295
//! expect: clamped=0 255 77 0
//! expect: floats=16777216 3 -7
//! expect: palette=63390 6371 32 25388
//! expect: rows=123 123 1221 3661 6345 8297 8297 8297 mixed=1 0

// Integer elements read into, and stored from, values the integer census holds
// in a `long long` take the integer twins of the typed-array accessors
// (`elementIntegerAtIndex`, `setElementIntegerAtIndex`, `readIntegerInBounds`,
// `writeIntegerInBounds`) instead of a round trip through `double`. These are
// the cases where that is easy to get wrong: ToIntN/ToUintN wrapping of an
// out-of-range integer, Uint8Clamped's clamp, an integer rounded into a float
// view, and the loop shape (a masked palette lookup stored into a dense
// window) Bloom's upscaler is written in.

const PALETTE_SIZE = 256

const palette = new Uint16Array(PALETTE_SIZE)
for (let i = 0; i < PALETTE_SIZE; i++) palette[i] = ((i & 0xf8) << 8) | ((i & 0xfc) << 3) | (i >> 3)

const tone = new Uint8Array(4)
tone[0] = 248
tone[1] = 7
tone[2] = 255
tone[3] = 31
const out = new Uint16Array(4)
for (let p = 0; p < 4; p++) out[p] = palette[(tone[p]! * 3 + 9) & 255]!

const small = new Uint16Array(6)
const values = [7, 9, -65536, 255, -1, 65537]
for (let i = 0; i < 6; i++) small[i] = values[i]!
console.log('pixels=' + [small[0], small[1], small[2], small[3], small[4], small[5]].join(' '))

const u8 = new Uint8Array(2)
const i8 = new Int8Array(3)
const u16 = new Uint16Array(1)
const u32 = new Uint32Array(1)
let big = 255
u8[0] = big
big = big + 1
u8[1] = big
i8[0] = big >> 1
i8[1] = (big >> 1) - 1
i8[2] = 128
const i16 = new Int16Array(1)
i16[0] = 65535
u16[0] = -1
u32[0] = -1
console.log('wrapped=' + [u8[0], u8[1], i8[0]! + 256, i8[1], i8[2], i16[0], u16[0], u32[0]].join(' '))

const clamped = new Uint8ClampedArray(4)
let level = -5
clamped[0] = level
level = 300
clamped[1] = level
level = 77
clamped[2] = level
clamped[3] = level - 200
console.log('clamped=' + [clamped[0], clamped[1], clamped[2], clamped[3]].join(' '))

const f32 = new Float32Array(3)
let n = 16777217
f32[0] = n
n = 3
f32[1] = n
f32[2] = n - 10
console.log('floats=' + [f32[0], f32[1], f32[2]].join(' '))

console.log('palette=' + [out[0], out[1], out[2], out[3]].join(' '))

const ROWS = 68
const clampedRows = new Uint16Array(8)
for (let y = 0; y < 8; y++) {
  const cell = y * 20 - 30
  const other = y < 4 ? Math.max(cell - 1, 0) : Math.min(cell + 1, ROWS - 1)
  clampedRows[y] = (other + 1) * 122 + 1
}
console.log('rows=' + Array.from(clampedRows).join(' ') + ' mixed=' + String(Math.max(0.5, 1)) + ' ' + String(Math.min(-0, 0)))
