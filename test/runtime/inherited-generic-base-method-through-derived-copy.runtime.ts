//! expect: 1 x 2 1
//! expect: 2 base x 2
//! expect: 3 p r 3 3
//! expect: 1 7 1 s
// A member declared on a generic BASE whose copies differ in layout, reached
// from outside the class through a DERIVED generic copy. The receiver names
// the derived copy; the member's frame is the base copy that derived copy
// inherits from, not the base at its root.
abstract class Base<T> {
  protected readonly buffer: T[] = []
  label = 'base'
  last: T | undefined = undefined
  load(rows: T[]) {
    for (const r of rows) {
      this.buffer.push(r)
      this.last = r
    }
  }
  first(): T | undefined {
    return this.buffer[0]
  }
}
class Derived<T> extends Base<T> {
  count() {
    return this.buffer.length
  }
}
const a = new Derived<{ a: string }>()
a.load([{ a: 'x' }])
const b = new Derived<{ b: number }>()
b.load([{ b: 1 }, { b: 2 }])
console.log(a.count(), a.first()?.a, b.count(), b.first()?.b)
console.log(b.count(), b.label, a.last?.a, b.last?.b)

class Mid<T> extends Base<T> {
  size() {
    return this.buffer.length
  }
}
class Leaf<T> extends Mid<T> {}
const leaf = new Leaf<{ p: string }>()
leaf.load([{ p: 'p' }, { p: 'q' }, { p: 'r' }])
const other = new Leaf<{ n: number }>()
other.load([{ n: 3 }])
console.log(leaf.size(), leaf.first()?.p, leaf.last?.p, other.first()?.n, other.last?.n)

class D2<T> extends Base<{ w: T }> {
  width() {
    return this.buffer.length
  }
}
const d = new D2<number>()
d.load([{ w: 7 }])
const e = new D2<string>()
e.load([{ w: 's' }])
console.log(d.width(), d.first()?.w, e.width(), e.last?.w)
