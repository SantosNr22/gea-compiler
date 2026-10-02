// Each loop iteration binds a fresh `let` and allocates a fresh object, and
// each iteration's closure captures its receiver alone -- exactly the single-
// ref fast path. Every iteration's closure must read its OWN object; the fast
// path must not let two iterations' packed environments alias one another.
class Cell {
  v: number
  constructor(v: number) {
    this.v = v
  }
  reader(): () => number {
    return () => this.v
  }
}

const readers: Array<() => number> = []
for (let i = 0; i < 4; i++) {
  const cell = new Cell(i * 10)
  readers.push(cell.reader())
}
console.log(readers.map((read) => read()).join(','))

//! expect: 0,10,20,30
