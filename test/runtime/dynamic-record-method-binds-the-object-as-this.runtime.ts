// A METHOD READ OFF AN OBJECT HELD AS `unknown` AND ASSERTED TO AN INTERFACE.
//
// `(stream as Like).once('end', h)` is a member call: the method runs with
// `stream` as `this`. The interface's method signature declares no receiver, so
// the record member the assertion builds had no way to pass one, and a method
// whose own ABI takes `this` as its leading parameter (here, one returning
// `this` with a `this`-typed listener) aborted with "a dynamic call omitted
// argument 0".

type Listener = (this: Emitter, ...args: readonly any[]) => void

class Emitter {
  names: string[] = []
  once(name: string, listener: Listener): this {
    this.names.push(name)
    listener.call(this)
    return this
  }
}
class Child extends Emitter {}

interface Like {
  once(name: string, listener: Listener): unknown
}

function register(stream: unknown): number {
  const like = stream as Like
  let fired = 0
  like.once('end', (): void => {
    fired++
  })
  like.once('close', (): void => {
    fired++
  })
  return fired
}

const child = new Child()
//! expect: fired=2
console.log(`fired=${register(child)}`)
//! expect: recorded=end,close
console.log(`recorded=${child.names.join(',')}`)
