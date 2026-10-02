// A class declared inside a function is evaluated per call: each evaluation has
// its own method state, so the class is not a leaf however plain its fields.
function makeSample(seed: number): number {
  class Sample {
    id: number
    constructor(id: number) {
      this.id = id
    }
    twice(): number {
      return this.id * 2
    }
  }
  return new Sample(seed).twice()
}

function churn(): number {
  let sum = 0
  for (let i = 0; i < 2000; i++) sum += makeSample(i)
  return sum
}

//! expect: first=3998000
console.log('first=' + churn())
//! expect: second=3998000
console.log('second=' + churn())
//! emitted-lacks: gea_traceLeaf
