// TWO ASYNC FUNCTIONS STARTED BACK TO BACK INTERLEAVE AT EVERY AWAIT.
//
// ECMA-262 27.7.5.3 Await: an `await` suspends the running async function and
// returns control to its caller; the continuation is a PromiseReaction job
// that runs later, in FIFO order with every other job. So `a()` runs to its
// first `await`, returns, `b()` runs to ITS first await, returns, and from
// then on the two alternate one step at a time.
//
// The blocking model lowered `await x` to `x.awaited()`: a nested reactor pump
// on the C++ stack that does not return until `x` settles. `a()` therefore did
// not return to its caller at its first await -- it pumped, and the pump ran
// `a`'s own continuation to completion (and `b` could not even START until `a`
// had finished). Observed on the blocking build:
//   a0 a1 a2 adone b0 b1 b2 bdone sync
const log: string[] = []

async function worker(name: string, steps: number): Promise<number> {
  let sum = 0
  for (let i = 0; i < steps; i++) {
    log.push(`${name}${i}`)
    const value = await Promise.resolve(i)
    sum += value
  }
  log.push(`${name}done`)
  return sum
}

async function main(): Promise<void> {
  const a = worker('a', 3)
  const b = worker('b', 3)
  log.push('sync')
  const x = await a
  const y = await b
  console.log(log.join(' '))
  console.log(`sums:${x},${y}`)
}

main()
//! expect: a0 b0 sync a1 b1 a2 b2 adone bdone
//! expect: sums:3,3
