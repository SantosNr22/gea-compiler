// A stream-like class that declares no `emit` override of its own -- exactly
// the shape `node-compat`'s `Readable`/`Writable`/`Duplex` collapsed to once
// their pass-through `override emit(name, ...args) { return super.emit(...) }`
// was recognized as dead weight (it bought no covariant return, unlike
// `on`/`once`, and cost a second rest-array copy on every emit). Once no
// class in the chain owns `emit`, a structural view built for an interface
// whose `emit` member names a NARROWER event-name type (`string`, inferred
// from how the interface is actually called) has to bind the ancestor's own
// `emit(name: string | symbol, ...args)` -- and both sides still end in a
// rest tail, so this is `restForwards`, not `restPacks`: the tail elements
// already agree, but the fixed `name` position ahead of it does not, and
// needs the same widening `restPacks` already gave its own fixed prefix.
//! expect: tick 1,2
//! expect: tick 3
//! expect: done

type Listener = (...args: any[]) => void

class Emitter {
  private listeners: Record<string, Listener[]> = {}
  on(name: string | symbol, fn: Listener): void {
    const key = String(name)
    const group = this.listeners[key]
    if (group === undefined) this.listeners[key] = [fn]
    else group.push(fn)
  }
  emit(name: string | symbol, ...args: unknown[]): boolean {
    const group = this.listeners[String(name)]
    if (group === undefined) return false
    for (const fn of group) fn(...args)
    return true
  }
}

// Neither of these two re-declares `emit`: the interface below binds straight
// through to `Emitter.emit`, the way `Leaf extends Middle extends Emitter`
// binds through both once the redundant overrides are gone.
class Middle extends Emitter {
  on(name: string, fn: Listener): this {
    super.on(name, fn)
    return this
  }
}
class Leaf extends Middle {}

interface Sink {
  emit(name: string, ...args: unknown[]): boolean
}

function relay(sink: Sink, values: number[]): void {
  sink.emit('tick', ...values)
}

const leaf = new Leaf()
leaf.on('tick', (...args: unknown[]) => console.log('tick ' + args.join(',')))
relay(leaf, [1, 2])
relay(leaf, [3])
console.log('done')
