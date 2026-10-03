//! expect: u=0.0968564 v=0.645700 tone=255 px=20522

// The per-cell loop shape the gallery's pixel apps (Bloom's Gray-Scott step,
// Ripple, Reel) are written in: Float32Array fields copied to `const` locals,
// module `const` integers as loop bounds and neighbour offsets, every float
// result wrapped in `Math.fround`, and `Math.min`/`Math.max` clamps into a
// Uint16Array. It has to lower to direct element access, float32 arithmetic
// and inline Math -- not a host callable per `Math.fround` and a `double`
// index per element read.

const W = 32
const H = 16
const PITCH = 34 // W + 2
const CELLS = 612 // PITCH * (H + 2)
const FIRST = 34
const LAST_GHOST = 578 // (H + 1) * PITCH

class Field {
  u = new Float32Array(CELLS)
  v = new Float32Array(CELLS)
  nextU = new Float32Array(CELLS)
  nextV = new Float32Array(CELLS)
  tone = new Uint8Array(CELLS)
  feed = 0.037
  kill = 0.06

  seed() {
    const u = this.u
    const v = this.v
    for (let c = 0; c < CELLS; c++) {
      u[c] = 1
      v[c] = 0
    }
    for (let y = 6; y < 10; y++) {
      for (let x = 14; x < 18; x++) {
        v[(y + 1) * PITCH + x + 1] = 0.5
      }
    }
  }

  step() {
    const u = this.u
    const v = this.v
    const nextU = this.nextU
    const nextV = this.nextV
    const edgeU = Math.fround(0.2)
    const cornerU = Math.fround(0.05)
    const edgeV = Math.fround(0.1)
    const cornerV = Math.fround(0.025)
    const feed = Math.fround(this.feed)
    const keepV = Math.fround(0.5 - this.feed - this.kill)
    const up = -PITCH
    const down = PITCH

    for (let c = FIRST + 1; c < LAST_GHOST - 1; c++) {
      const uc = u[c]
      const vc = v[c]
      const edgesU = Math.fround(Math.fround(u[c - 1] + u[c + 1]) + Math.fround(u[c + up] + u[c + down]))
      const cornersU = Math.fround(Math.fround(u[c + up - 1] + u[c + up + 1]) + Math.fround(u[c + down - 1] + u[c + down + 1]))
      const edgesV = Math.fround(Math.fround(v[c - 1] + v[c + 1]) + Math.fround(v[c + up] + v[c + down]))
      const cornersV = Math.fround(Math.fround(v[c + up - 1] + v[c + up + 1]) + Math.fround(v[c + down - 1] + v[c + down + 1]))
      const spreadU = Math.fround(Math.fround(edgesU * edgeU) + Math.fround(cornersU * cornerU))
      const spreadV = Math.fround(Math.fround(edgesV * edgeV) + Math.fround(cornersV * cornerV))
      const uvv = Math.fround(Math.fround(uc * vc) * vc)
      const fed = Math.fround(feed - Math.fround(feed * uc))
      nextU[c] = Math.fround(spreadU - uvv) + fed
      nextV[c] = Math.fround(spreadV + uvv) + Math.fround(vc * keepV)
    }

    this.u = nextU
    this.v = nextV
    this.nextU = u
    this.nextV = v
  }

  shade() {
    const v = this.v
    const tone = this.tone
    for (let c = FIRST; c < LAST_GHOST; c++) {
      const lit = Math.fround(Math.fround(v[c] * 600) + Math.fround(v[c - 1] - v[c + 1]))
      tone[c] = Math.min(255, Math.max(0, Math.floor(lit)))
    }
  }
}

const field = new Field()
field.seed()
for (let i = 0; i < 20; i++) field.step()
field.shade()

const pixels = new Uint16Array(W * H)
const tone = field.tone
let sum = 0
for (let y = 0; y < H; y++) {
  const row = (y + 1) * PITCH + 1
  for (let x = 0; x < W; x++) {
    const t = tone[row + x]
    pixels[y * W + x] = ((t & 0xf8) << 8) | ((t & 0xfc) << 3) | (t >> 3)
    sum += t
  }
}

const probe = 8 * PITCH + 16
console.log(
  'u=' +
    Math.fround(field.u[probe]).toPrecision(6) +
    ' v=' +
    Math.fround(field.v[probe]).toPrecision(6) +
    ' tone=' +
    String(tone[probe]) +
    ' px=' +
    String(sum)
)
