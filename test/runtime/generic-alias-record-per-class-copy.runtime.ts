// A generic alias record written inside a split generic class is laid out per
// copy: `Cell<T>` in `Box<Session>` holds a class reference and in
// `Box<Uint8Array>` a typed array.
type Cell<T> = { value: T }

class Box<T> {
  cells: Cell<T>[] = []
  push(value: T): void {
    this.cells.push({ value })
  }
  first(): T | undefined {
    return this.cells[0]?.value
  }
}

class Session {
  constructor(readonly id: string) {}
}

const sessions = new Box<Session>()
sessions.push(new Session('s1'))
const bytes = new Box<Uint8Array>()
bytes.push(new Uint8Array([7, 8]))
console.log(sessions.first()?.id, bytes.first()?.[1])

//! expect: s1 8
