// `palette[texture[k & 0xffff] & 255]` -- a rotozoom's inner loop
// (geastack/demos reel), compiled as that app is: without
// noUncheckedIndexedAccess. `x & M` lies in [0, M] for every int32 `x`, so each
// lookup is a dense window checked once at the preheader (`size() >= M + 1`)
// rather than a detached/bounds/backing check per access. A table SHORTER than
// the mask's reach must keep the checked path and read `undefined` past its
// end. A remainder is NOT non-negative -- `-3 % 16` is -3 in JS -- so a `%`
// window tests the index's sign (and an un-narrowed one its fraction) at the
// access. Before, an Array's fast path read below its storage; now the cold
// path takes the negative index and refuses it, which is this program's last
// line. (Typed arrays' cold path refuses negatives and fractions the same way.)
//! emitted-has: gea::TypedArray<uint8_t>::readIntegerInBounds(gea_dense_0, static_cast<std::size_t>((gea::integerBitwiseAnd(
//! emitted-has: gea::TypedArray<uint16_t>::readIntegerInBounds(gea_dense_1
//! emitted-has: gea_arg_0->size() >= 65536 && gea_arg_1->size() >= 256
//! expect: masked 567507580
//! expect: short 63022
//! expect: remainder-pos 3600
//! expect: array-pos 600
//! expect-abort

function masked(texture: Uint8Array, palette: Uint16Array, du: number, dv: number): number {
  let sum = 0
  let u = -123456789 | 0
  let v = 987654321 | 0
  for (let x = 0; x < 5000; x++) {
    const p = palette[texture[(((v >>> 8) & 0xff00) | ((u >>> 16) & 0xff)) & 0xffff] & 255]
    u = (u + du) | 0
    v = (v + dv) | 0
    sum = (sum + p * (x & 7)) | 0
  }
  return sum
}

function short(table: Uint8Array): number {
  let sum = 0
  for (let x = 0; x < 300; x++) {
    const p: number | undefined = table[x & 255]
    sum += p === undefined ? 1000 : p
  }
  return sum
}

function remainder(table: Uint8Array, from: number): number {
  let sum = 0
  for (let i = from; i < from + 40; i++) sum += table[i % 16]
  return sum
}

function arrayRemainder(table: number[], from: number): number {
  let sum = 0
  for (let i = from; i < from + 40; i++) sum += table[i % table.length]
  return sum
}

const texture = new Uint8Array(65536)
for (let i = 0; i < 65536; i++) texture[i] = (i * 2654435761) >>> 24
const palette = new Uint16Array(256)
for (let i = 0; i < 256; i++) palette[i] = (i * 40503) & 0xffff
console.log('masked', masked(texture, palette, 91234, -45678))
const small = new Uint8Array(200)
for (let i = 0; i < 200; i++) small[i] = i & 63
console.log('short', short(small))
const sixteen = new Uint8Array(16)
for (let i = 0; i < 16; i++) sixteen[i] = 90
console.log('remainder-pos', remainder(sixteen, 3))
const ring: number[] = []
for (let i = 0; i < 8; i++) ring.push(15)
console.log('array-pos', arrayRemainder(ring, 3))
// Last: JS answers NaN, and this compiler's cold path refuses a negative index
// outright. The fast path read below the ring's storage here, silently.
console.log('array-neg', arrayRemainder(ring, -20))
