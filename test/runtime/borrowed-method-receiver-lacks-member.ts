// A borrowed method whose body reads a `this` member the receiver's class
// does not have. The copy of the body placed in the receiver's class
// (`semantics/borrowed-method-receiver-copy-source-transform.ts`) is
// type-checked against that class, and the missing member is refused there
// by the checker rather than read off storage the object does not have.
//
// Under node this prints lacks=NaN.
//
//! expect-refusal: Property 'count' does not exist on type 'Lacks'
class Counter {
  count = 0
  bump(by: number): number {
    this.count += by
    return this.count
  }
}

class Lacks {
  step(): number {
    return Counter.prototype.bump.call(this, 5)
  }
}

console.log('lacks=' + new Lacks().step())
