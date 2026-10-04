// Module constants built from a runtime size with `| 0` (or a shift) are
// int32: indices derived from them must be integer math, not doubles, in a
// hot loop that reads them.
const WIDTH = (Math.floor(Number.parseInt('480', 10) / 2) * 2) | 0
const HEIGHT = (Math.floor(Number.parseInt('272', 10) / 2) * 2) | 0
const HALF_W = (WIDTH >> 1) | 0
const HALF_H = (HEIGHT >> 1) | 0

function fill(words: Uint32Array, seed: number) {
  let u = seed | 0
  for (let y = 0; y < HALF_H; y++) {
    const line = y * HALF_W
    for (let x = 0; x < HALF_W; x++) {
      words[line + x] = (u >>> 3) & 0xffff
      u = (u + 40503) | 0
    }
  }
}

const words = new Uint32Array(HALF_W * HALF_H)
fill(words, 7)
let sum = 0
for (let i = 0; i < words.length; i += 97) sum = (sum + (words[i] ?? 0)) | 0
console.log(WIDTH, HEIGHT, HALF_W, HALF_H, sum)
