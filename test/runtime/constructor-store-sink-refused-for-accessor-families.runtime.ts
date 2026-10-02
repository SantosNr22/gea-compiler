// The store of a constructor's argument into `this` is only emitted behind the later
// reads when no accessor in the class family can observe the field in between. A
// setter that reads the stored field, on the class or on one it inherits to, must still see it.
'use strict'
class WithSetter {
  command: Record<string, unknown>
  seen: unknown = null
  private _n = 0
  constructor(command: Record<string, unknown>) {
    this.command = command
    this.n = (command.a as number) + 1
  }
  set n(value: number) {
    this._n = value
    this.seen = this.command.a
  }
  get n(): number {
    return this._n
  }
}
class Inherits extends WithSetter {
  extra = 1
}
const a = new WithSetter({ a: 7 })
const d = new Inherits({ a: 9 })
console.log(a.n, a.seen, d.n, d.seen, d.extra)
//! expect: 8 7 10 9 1
