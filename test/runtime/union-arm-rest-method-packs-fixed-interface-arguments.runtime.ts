//! expect: A stateChanged:closed,connecting
//! expect: B stateChanged:idle,busy
//! expect: states:connecting busy

// Two unrelated classes are the only values handed to `ObjectWithState`, so
// the slot is carried as the sum of the two classes and the call binds each
// arm's own `emit(event, ...args)` directly. The interface member declares
// FIXED parameters, so each arm's body must receive the trailing arguments
// packed into its rest Array -- the same packing a single bound class gets.

interface ObjectWithState {
  s: { state: string }
  emit(event: 'stateChanged', state: string, newState: string): void
}

class A {
  s = { state: 'closed' }
  emit(event: string, ...args: string[]): boolean {
    console.log('A ' + event + ':' + args.join(','))
    return true
  }
}

class B {
  s = { state: 'idle' }
  emit(event: string | symbol, ...args: unknown[]): boolean {
    console.log('B ' + String(event) + ':' + args.join(','))
    return args.length > 0
  }
}

function transition(target: ObjectWithState, newState: string): void {
  target.emit('stateChanged', target.s.state, newState)
  target.s.state = newState
}

const a = new A()
const b = new B()
transition(a, 'connecting')
transition(b, 'busy')
console.log('states:' + a.s.state + ' ' + b.s.state)
