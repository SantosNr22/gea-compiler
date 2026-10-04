// A grid whose size is only known at run time (a screen read at startup), and
// a row offset `(cell + 1) * pitch + 1` used through a power-of-two mask in the
// inner loop. The offset is an integer of unbounded magnitude as far as one
// body can tell, but `(near + x) & 16383` must still stay in the integers: it
// is the hot loop of a bilinear upscale.
const sizeText = '120'
const GRID = Number.parseInt(sizeText, 10)

class Upscale {
  readonly tone = new Uint8Array(16384)
  readonly rows = new Uint16Array(65536)
  private readonly gridW = GRID
  private readonly pitch = GRID + 2
  private readonly height = GRID * 4

  blend() {
    const tone = this.tone
    const rows = this.rows
    const gridW = this.gridW | 0
    const pitch = this.pitch | 0
    const height = this.height | 0
    for (let y = 0; y < height; y++) {
      const cell = y >> 2
      const near = (cell + 1) * pitch + 1
      const row = y * gridW
      for (let x = 0; x < gridW; x++) {
        rows[(row + x) & 65535] = tone[(near + x) & 16383]! * 5
      }
    }
  }
}

const upscale = new Upscale()
for (let i = 0; i < 16384; i++) upscale.tone[i] = i & 255
upscale.blend()
let sum = 0
for (let i = 0; i < 65536; i++) sum = (sum + upscale.rows[i]!) % 1000000007
console.log(sum)
