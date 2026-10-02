// A closure whose ENTIRE capture is the receiver alone -- one non-boxed
// `gea::Ref`, nothing else -- escapes the method that made it, is copied to a
// second variable, and is called repeatedly after the only OTHER handle to
// the instance is dropped. Pins that packing this shape without a
// `HeapEnvironmentBlock` still keeps the captured object alive for exactly as
// long as any copy of the closure holds it, and that repeated calls neither
// leak nor over-release the one reference the environment owns.
class Counter {
  n: number
  constructor(n: number) {
    this.n = n
  }
  bump(): () => number {
    return () => {
      this.n += 1
      return this.n
    }
  }
}

let owner: Counter | null = new Counter(10)
const bump = owner.bump()
owner = null // the only other handle to the Counter is gone now; the
// closure's own captured reference must be what keeps it alive.

console.log(bump(), bump(), bump())

const copy = bump
console.log(copy(), bump())

//! expect: 11 12 13
//! expect: 14 15
//! emitted-has: gea::packTransientEnvironment
