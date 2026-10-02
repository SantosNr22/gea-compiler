// A `const` alias of a generic class nothing ever instantiates names a class
// object the compilation introduces no cell for. The alias has nothing to
// store, and the program must still build and run.
class Box<T> {
  value: T
  constructor(value: T) {
    this.value = value
  }
}

class Unused<T> {
  item: T | null = null
}

const UnusedAlias = Unused
export { UnusedAlias }

const b = new Box<number>(7)
console.log(b.value)
