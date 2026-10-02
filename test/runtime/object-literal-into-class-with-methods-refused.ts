//! expect-refusal: which has behaviour (methods, accessors, field initializers or a native base) a plain object would not inherit
// A literal can take a class's layout only when the class has no behaviour
// the literal would lack. `{ n: 1, twice() {...} }` satisfies `Counter`
// structurally, but its `twice` is its OWN property while an instance's is
// inherited from Counter.prototype -- sharing the struct would dispatch the
// prototype method for the literal. The allocation refuses by name.
class Counter {
  n = 0
  twice(): number {
    return this.n * 2
  }
}
const counted: Counter = {
  n: 1,
  twice() {
    return 7
  }
}
console.log(counted.twice())
