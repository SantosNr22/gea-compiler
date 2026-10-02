// Closures that are only CALLED, stored and copied: handed to a promise
// reaction, to a class method, through a callable value, and kept in a record
// that `Object.assign` copies. None of those reads a function object's
// identity, so no closure here may be allocated with a `FunctionObjectIdentity`
// (`identifyCallable`); `cb !== undefined` asks only whether one is present.
type Done = (value: number) => void
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
  console.log(total)
}
void main()
export {}
