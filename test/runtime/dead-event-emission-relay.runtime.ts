// An emitter class stating the event protocol through its tags. Relays whose
// chain ends at an emitter nobody listens to are dead and lower to `false`;
// everything a listener can observe still happens: a live listener partway
// down a relay chain, an `'error'` relay, a registration forwarded from a
// `'newListener'` listener, and an emit whose result the program reads.
'use strict'
type Handler = (...args: any[]) => void

class Emitter {
  private readonly groups = new Map<string, Handler[]>()

  /** @gea-event-listen */
  on(name: string, fn: Handler): this {
    const existing = this.groups.get('newListener')
    if (existing !== undefined && name !== 'newListener') for (const listener of existing.slice()) listener(name, fn)
    const group = this.groups.get(name)
    if (group === undefined) this.groups.set(name, [fn])
    else group.push(fn)
    return this
  }

  /** @gea-event-emit */
  emit(name: string, ...args: any[]): boolean {
    const group = this.groups.get(name)
    if (group === undefined) {
      if (name === 'error') throw new Error('unhandled error event')
      return false
    }
    for (const fn of group.slice()) fn(...args)
    return true
  }

  /** @gea-event-listeners */
  listeners(name: string): Handler[] {
    return (this.groups.get(name) ?? []).slice()
  }

  /** @gea-event-listener-state */
  listenerCount(name: string): number {
    return this.groups.get(name)?.length ?? 0
  }
}

class Pool extends Emitter {}
class Server extends Emitter {}
class Client extends Emitter {}
class Relay extends Emitter {}
class Counted extends Emitter {}

const relayed = ['checkedOut', 'checkedIn'] as const
const pool = new Pool()
const server = new Server()
const client = new Client()
for (const event of relayed) pool.on(event, (e: any) => server.emit(event, e))
for (const event of relayed) server.on(event, (e: any) => client.emit(event, e))
pool.on('error', (e: any) => server.emit('error', e))
server.on('error', (e: any) => client.emit('error', e))

let seen = 0
server.on('checkedIn', (e: any) => {
  seen += e as number
})
client.on('error', (e: any) => console.log('error relayed', e instanceof Error))

pool.emit('checkedOut', 1)
pool.emit('checkedIn', 2)
pool.emit('checkedIn', 3)
pool.emit('error', new Error('boom'))
console.log(seen, pool.emit('checkedOut', 4), client.emit('checkedOut', 5))
// A dead emit still evaluates its arguments.
const note = (value: number): number => {
  console.log('evaluated', value)
  return value
}
pool.emit('checkedOut', note(6))

const outer = new Client()
const inner = new Client()
outer.on('newListener', (name: string, listener: Handler) => {
  inner.on(name, listener)
})
outer.on('ready', (value: any) => console.log('ready via mirror', value))
inner.emit('ready', 7)
inner.emit('unheard', 8)

const copy = new Client()
for (const listener of outer.listeners('ready')) copy.on('ready', listener)
copy.emit('ready', 9)
// A registration of a listener that never has an effect is not made at all --
// unless something can count it.
const first = new Relay()
const last = new Client()
first.on('x', (e: any) => last.emit('x', e))
first.emit('x', 1)
const counted = new Counted()
counted.on('y', (e: any) => last.emit('y', e))
console.log('counted', counted.listenerCount('y'))
//! expect: error relayed true
//! expect: 5 true false
//! expect: evaluated 6
//! expect: ready via mirror 7
//! expect: ready via mirror 9
//! expect: counted 1
export {}
