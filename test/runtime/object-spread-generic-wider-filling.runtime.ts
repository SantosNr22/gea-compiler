// A generic spread source filled with a record WIDER than its constraint: the
// copy's object literal must carry the filling's extra members, not only the
// constraint's.
type Timeouts = { timeoutMS?: number; socketTimeoutMS?: number }
const resolve = <T extends Partial<Timeouts>>(options: T): T & { waitMS: number } => ({ waitMS: 5, ...options })
const options: { name: string; timeoutMS?: number } = { name: 'a', timeoutMS: 9 }
const out = resolve(options)
console.log(out.name, out.timeoutMS, out.waitMS)
//! expect: a 9 5
