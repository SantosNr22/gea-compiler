// A constructor that stores its argument into `this` first and then keeps reading
// fields off the same argument: the store is emitted behind those reads and moves,
// so the argument is not retained and released once more per construction. The
// reads still see the argument, and a read of the stored field in between keeps
// the ordinary copy.
'use strict'
class Plain {
  command: Record<string, unknown>
  n: number
  m: number
  constructor(command: Record<string, unknown>) {
    this.command = command
    this.n = (command.a as number) + 1
    this.m = (command.b as number) + 2
  }
}
class ReadsBack {
  command: Record<string, unknown>
  seen: unknown
  constructor(command: Record<string, unknown>) {
    this.command = command
    this.seen = this.command.a
  }
}
class Throws {
  command: Record<string, unknown>
  n: number
  constructor(command: Record<string, unknown>) {
    this.command = command
    if (command.bad === true) throw new Error('bad')
    this.n = 1
  }
}
const a = new Plain({ a: 10, b: 20 })
const b = new ReadsBack({ a: 'x' })
let thrown = ''
try {
  new Throws({ bad: true })
} catch (error) {
  thrown = (error as Error).message
}
const c = new Throws({ bad: false })
console.log(a.n, a.m, a.command.a, b.seen, b.command.a, thrown, c.n)
//! expect: 11 22 10 x x bad 1
