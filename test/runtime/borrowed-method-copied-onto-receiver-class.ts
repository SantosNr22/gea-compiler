// `Owner.prototype.m.call(this, ...)` from a class that does not extend
// `Owner`: the borrowed body runs on the caller's own instance, so every
// `this.x` inside it is the caller's. The body is copied into the calling
// class and type-checked there
// (`semantics/borrowed-method-receiver-copy-source-transform.ts`), which is
// exactly that lookup; the owner's own instances keep the original.
//
//! expect: other=15
//! expect: again=20
//! expect: owner=5
//! expect: label=other:15
class Counter<T extends number = number> {
  count = 0
  bump(by: T): number {
    this.count += by
    return this.count
  }
  label(): string {
    return this.name() + ':' + this.count
  }
  name(): string {
    return 'counter'
  }
}

class Other {
  count = 10
  step(): number {
    return Counter.prototype.bump.call(this, 5)
  }
  describe(): string {
    return Counter.prototype.label.call(this)
  }
  name(): string {
    return 'other'
  }
}

const other = new Other()
console.log('other=' + other.step())
console.log('again=' + other.step())
const counter = new Counter()
console.log('owner=' + counter.bump(5))
other.count = 15
console.log('label=' + other.describe())
