// Partial sources preserve omitted fields; intersection spreads copy all constituents.
//! expect: partial 2 kept
//! expect: empty 1 kept
//! expect: stored task r1 task.md
//! expect: assign 2 kept

interface State {
  a: number
  b: string
}

function merge(base: State, patch: Partial<State>): State {
  return { ...base, ...patch }
}

const base: State = { a: 1, b: 'kept' }
const partial = merge(base, { a: 2 })
console.log('partial', partial.a, partial.b)
const empty = merge(base, {})
console.log('empty', empty.a, empty.b)

type Session = { title: string }
type Stored<T> = T & { revision: string; file: string }
function copy(session: Stored<Session>): Stored<Session> {
  return { ...session }
}
const stored = copy({ title: 'task', revision: 'r1', file: 'task.md' })
console.log('stored', stored.title, stored.revision, stored.file)

function assign(base: State, patch: Partial<State>): State {
  return Object.assign({}, base, patch)
}
const assigned = assign(base, { a: 2 })
console.log('assign', assigned.a, assigned.b)
