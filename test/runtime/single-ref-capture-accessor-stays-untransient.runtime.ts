// A capturing accessor whose environment is exactly one non-boxed ref-owned
// capture -- the identical SHAPE the ordinary closure path routes through the
// single-ref fast path. An accessor's environment lives on the record and is
// read back IN PLACE with `gea::storedEnvironment`, which has no scratch slot
// to reconstruct a transiently-packed environment into
// (`translation-unit.ts`'s `thunkOf` must keep routing an accessor through
// the untransient `gea::packEnvironment`/`gea::unpackEnvironment` pair, never
// `gea::packTransientEnvironment`). Two accessor instances must not alias
// each other's captured state either.
class Boxed {
  n: number
  constructor(n: number) {
    this.n = n
  }
}
interface Doubled {
  readonly doubled: number
}
function makeBox(seed: number): Doubled {
  const state = new Boxed(seed)
  return {
    get doubled(): number {
      return state.n * 2
    }
  }
}

const first = makeBox(5)
const second = makeBox(9)
console.log(first.doubled, second.doubled, first.doubled)

//! expect: 10 18 10
//! emitted-lacks: gea::packTransientEnvironment
//! emitted-lacks: gea::unpackTransientEnvironment
