// The index signature's values are records that point back at the holder: a
// real cycle through a type a careless proof would call a leaf. It must carry
// no `gea_traceLeaf`, and the garbage it forms must still be collected.
interface Slot {
  owner: Registry
  n: number
}
interface Registry {
  length: number
  [i: number]: Slot
}

function churn(): number {
  let sum = 0
  for (let i = 0; i < 3000; i++) {
    const registry: Registry = { length: 1 }
    registry[0] = { owner: registry, n: i }
    sum += registry[0]!.owner.length + registry[0]!.n
  }
  return sum
}

//! expect: first=4501500
console.log('first=' + churn())
//! expect: second=4501500
console.log('second=' + churn())
//! emitted-lacks: gea_traceLeaf
