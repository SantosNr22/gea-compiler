// Function declarations of one frame that call one another share one
// environment, and a sibling is rebuilt from it rather than read from a heap
// cell -- so the frame's closures form no cycle, and every function object
// keeps its own identity: `off(onValue)` still finds the listener `on`
// registered, from inside a sibling. A lone self-recursive declaration is the
// one-member case. An object literal's `[Symbol.iterator]() { return this }`
// binds its holder weakly and still answers the holder while it is alive.
'use strict'
type Listener = (value: string) => void
class Emitter {
  private listeners: Listener[] = []
  on(listener: Listener): void {
    this.listeners.push(listener)
  }
  off(listener: Listener): void {
    const index = this.listeners.indexOf(listener)
    if (index >= 0) this.listeners.splice(index, 1)
  }
  emit(value: string): void {
    for (const listener of this.listeners.slice()) listener(value)
  }
  get size(): number {
    return this.listeners.length
  }
}
interface Reader {
  stop(): number
  seen(): string
}
function makeReader(emitter: Emitter, label: string): Reader {
  const values: string[] = []
  let finished = false
  emitter.on(onValue)
  return {
    stop(): number {
      return close()
    },
    seen(): string {
      return label + ':' + values.join('') + (finished ? '.' : '')
    }
  }
  function onValue(value: string): void {
    values.push(value)
    if (value === '!') close()
  }
  function close(): number {
    emitter.off(onValue)
    finished = true
    return values.length
  }
}
const emitter = new Emitter()
const a = makeReader(emitter, 'a')
const b = makeReader(emitter, 'b')
emitter.emit('x')
console.log(emitter.size, a.seen(), b.seen())
console.log(b.stop(), emitter.size)
emitter.emit('!')
console.log(emitter.size, a.seen(), b.seen())
function countdown(n: number): string {
  return step(n)
  function step(k: number): string {
    return k === 0 ? 'go' : k + ',' + step(k - 1)
  }
}
console.log(countdown(3))
function parity(n: number): string {
  function isEven(k: number): boolean {
    return k === 0 ? true : isOdd(k - 1)
  }
  function isOdd(k: number): boolean {
    return k === 0 ? false : isEven(k - 1)
  }
  return (isEven(n) ? 'even' : 'odd') + (isEven === isEven ? '' : '?') + (isOdd === (isEven as unknown) ? '?' : '')
}
console.log(parity(7), parity(10))
function range(limit: number): Iterable<number> & Iterator<number> {
  let at = 0
  return {
    next(): IteratorResult<number> {
      return at < limit ? { value: at++, done: false } : { value: undefined, done: true }
    },
    [Symbol.iterator]() {
      return this
    }
  }
}
let total = 0
for (const value of range(4)) total += value
console.log(total)
//! expect: 2 a:x b:x
//! expect: 1 1
//! expect: 0 a:x!. b:x.
//! expect: 3,2,1,go
//! expect: odd even
//! expect: 6
