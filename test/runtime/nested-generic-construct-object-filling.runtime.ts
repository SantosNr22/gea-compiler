// A generic class constructed inside another generic class's method, filled
// with an anonymous object type built over the OUTER class's parameter. Each
// copy of `Holder` constructs its own closed `Box` copy: `Box<{ v: number }>`
// and `Box<{ v: string }>`. The census used to see `{ v: T }` as closed --
// its hole sits in a property, not a type argument -- and minted one OPEN
// `Box` copy whose `items: T[]` had no carrier.
class Box<T> {
  items: T[] = []
  all(): T[] {
    return this.items
  }
}
class Holder<T> {
  constructor(readonly seed: T) {}
  make(): Box<{ v: T }> {
    const box = new Box<{ v: T }>()
    box.items.push({ v: this.seed })
    return box
  }
}
console.log(new Holder(1).make().all()[0]?.v, new Holder('s').make().all()[0]?.v)
//! expect: 1 s
