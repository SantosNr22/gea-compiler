// `value instanceof Counter` over an `unknown` narrows `value` to the class's
// own reference: the method call and the field read in the branch dispatch
// natively, and the increment is visible through the original instance.
class Counter {
  count = 0
  constructor(readonly label: string) {}
  bump(by: number): number {
    this.count += by
    return this.count
  }
}
function drive(value: unknown): string {
  if (value instanceof Counter) return `${value.label} ${value.bump(3)} ${value.bump(4)} ${value.count}`
  return 'not a counter'
}
const original = new Counter('c')
const held: unknown[] = []
held.push(original)
held.push(false)
console.log(drive(held[0]))
console.log(drive(held[1]))
console.log(`original ${original.count}`)
//! expect: c 3 7 7
//! expect: not a counter
//! expect: original 7
//! emitted-lacks: getProperty(gea::PropertyKey::string("bump")
export {}
