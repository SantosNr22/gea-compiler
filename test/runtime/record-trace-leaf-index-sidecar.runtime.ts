// A record whose only unusual member is an index signature of scalars is a
// leaf of the cycle collector (`gea_traceLeaf`): the sidecar stores one carrier,
// and numbers add no edge. Holders of it are leaves in turn, and cyclic garbage
// that merely holds one must still be collected.
interface Samples {
  length: number
  [i: number]: number
}
interface Box {
  name: string
  samples: Samples
}

class Holder {
  peer: Holder | null = null
  box: Box
  constructor(box: Box) {
    this.box = box
  }
}

function makeBox(i: number): Box {
  const samples: Samples = { length: 2 }
  samples[0] = i
  samples[1] = i * 2
  return { name: 'b' + i, samples }
}

function churn(): number {
  let sum = 0
  for (let i = 0; i < 3000; i++) {
    const a = new Holder(makeBox(i))
    const b = new Holder(a.box)
    a.peer = b
    b.peer = a
    sum += a.box.samples[0]! + b.box.samples[1]! + a.box.samples.length
  }
  return sum
}

//! expect: first=13501500
console.log('first=' + churn())
//! expect: second=13501500
console.log('second=' + churn())
//! emitted-has: static constexpr bool gea_traceLeaf = true;
