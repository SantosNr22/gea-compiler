// The same shape `co-return-union-of-value-or-promise-settles-same-tick.
// runtime.ts` pins for a plain async function, asked here of an async CLASS
// METHOD instead: the 'return' operation's `caller` is the method's own
// `FunctionId`, and the slot census reads the caller's ABI off
// `abiOfCaller`/`input.abis`, which is keyed by `FunctionId` regardless of
// whether it names a function declaration or a method -- so this should
// settle the same way (a plain-value arm resolves, a promise arm adopts) as
// every other caller shape, pinned separately since nothing else exercises a
// union return out of a method body.
class Relay {
  async relay(x: string | Promise<string>): Promise<string> {
    return x
  }
}

async function main(): Promise<void> {
  const r = new Relay()
  console.log('value-arm:' + (await r.relay('v')))
  console.log('promise-arm:' + (await r.relay(Promise.resolve('p'))))
}

main()

//! expect: value-arm:v
//! expect: promise-arm:p
