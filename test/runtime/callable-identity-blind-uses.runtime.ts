// Identity demand is per call convention. Closures of one convention that are
// only called (promise reaction, class method argument, callable value,
// `Object.assign` copy, `!== undefined`) need no function object, while a
// DIFFERENT convention that is compared with `===` and removed from a list by
// identity must still answer by identity.
type Done = (value: number) => void
type Named = (name: string) => string
class Source {
  run(done: Done): void {
    done(1)
  }
}
let total = 0
const tally: Done = (n) => {
  total += n
}
const invoke = (f: (cb: Done) => void, cb: Done): void => f(cb)
const listeners: Named[] = []
const add = (fn: Named): void => {
  listeners.push(fn)
}
const remove = (fn: Named): boolean => {
  for (let i = 0; i < listeners.length; i++) {
    if (listeners[i] === fn) {
      listeners.splice(i, 1)
      return true
    }
  }
  return false
}
async function main(): Promise<void> {
  await Promise.resolve(2).then((v) => {
    total += v
  })
  new Source().run((v) => {
    total += v * 10
  })
  const options: { cb?: Done } = { cb: tally }
  const merged = Object.assign({}, options)
  if (merged.cb !== undefined) merged.cb(100)
  invoke((cb) => cb(1000), tally)
  const hello: Named = (name) => 'hello ' + name
  const bye: Named = (name) => 'bye ' + name
  add(hello)
  add(bye)
  console.log(
    total,
    remove((name) => 'hello ' + name),
    remove(bye),
    listeners.length,
    listeners[0] === hello,
    listeners[0]!('x')
  )
}
void main()
//! expect: 1112 false true 1 true hello x
export {}
