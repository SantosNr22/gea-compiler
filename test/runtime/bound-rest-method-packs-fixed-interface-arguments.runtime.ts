//! expect: stateChanged:closed->connecting
//! expect: state:connecting
//! expect: stateChanged:connecting->connected
//! expect: count:2

// mongodb's utils.ts `makeStateMachine`: a Topology (an EventEmitter) is
// handed to a transition function as `ObjectWithState`, whose `emit` member
// declares three FIXED string parameters, while the class's own
// `emit(event, ...args)` packs everything past the event into a rest Array.
// The record view binds the method into the member, so the view's adapter
// must pack the member's trailing arguments into the method's rest -- not
// forward them one by one to a body whose frame ends in an Array.

type Listener = (...args: any[]) => void

class Emitter {
  private listeners: Listener[] = []
  on(listener: Listener): void {
    this.listeners.push(listener)
  }
  emit(event: string | symbol, ...args: any[]): boolean {
    for (const listener of this.listeners) listener(String(event), ...args)
    return this.listeners.length > 0
  }
}

interface ObjectWithState {
  s: { state: string }
  emit(event: 'stateChanged', state: string, newState: string): void
}

function makeStateMachine(): (target: ObjectWithState, newState: string) => void {
  return function stateTransition(target, newState) {
    target.emit('stateChanged', target.s.state, newState)
    target.s.state = newState
  }
}

const transition = makeStateMachine()

class Topology extends Emitter {
  s = { state: 'closed' }
  count = 0
  connect(): void {
    transition(this, 'connecting')
    console.log('state:' + this.s.state)
    transition(this, 'connected')
  }
}

const topology = new Topology()
topology.on((event: string, from: string, to: string) => {
  topology.count++
  console.log(event + ':' + from + '->' + to)
})
topology.connect()
console.log('count:' + topology.count)
