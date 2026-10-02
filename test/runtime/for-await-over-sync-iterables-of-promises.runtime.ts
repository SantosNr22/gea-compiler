// `for await` over SYNC iterables: an array of promises, an array mixing
// promises and plain values, and a sync generator yielding promises
// (CreateAsyncFromSyncIterator). Each step awaits the value, so a promise
// that settles later is waited for in order, and another task started
// alongside interleaves with the loop step by step.
function later(value: string, hops: number): Promise<string> {
  let promise = Promise.resolve(value)
  for (let i = 0; i < hops; i++) promise = promise.then((v) => v)
  return promise
}

function* generated(): Generator<Promise<string>> {
  yield later('g0', 2)
  yield later('g1', 0)
}

async function other(log: string[]): Promise<void> {
  for (let i = 0; i < 12; i++) {
    log.push(`other:${i}`)
    await null
  }
}

async function main(): Promise<void> {
  const log: string[] = []
  const side = other(log)
  for await (const value of [later('a0', 3), later('a1', 0), later('a2', 1)]) log.push(`array:${value}`)
  await side
  const mixed: (string | Promise<string>)[] = ['m0', later('m1', 1), 'm2']
  for await (const value of mixed) log.push(`mixed:${value}`)
  for await (const value of generated()) log.push(`gen:${value}`)
  // One line, so the expectation pins the ORDER, not just the presence.
  console.log(log.join(' '))
}
main()
//! expect: other:0 other:1 other:2 other:3 other:4 other:5 array:a0 other:6 other:7 array:a1 other:8 other:9 array:a2 other:10 other:11 mixed:m0 mixed:m1 mixed:m2 gen:g0 gen:g1
