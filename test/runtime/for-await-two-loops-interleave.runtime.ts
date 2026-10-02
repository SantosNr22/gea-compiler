// Two `for await` loops over two async generators, started together and
// joined with `Promise.all`. Each generator awaits between its yields, so each
// loop's step settles on a later job than the one before it, and the two
// loops take turns on the job queue. Under the blocking model the first
// loop's `next()` read its promise in a nested pump and ran to completion
// before the second loop got a single step.
async function* counter(label: string, count: number): AsyncGenerator<string> {
  for (let i = 0; i < count; i++) {
    await null
    yield `${label}${i}`
  }
}

async function drain(label: string, count: number, log: string[]): Promise<number> {
  let seen = 0
  for await (const value of counter(label, count)) {
    log.push(value)
    seen++
  }
  log.push(`${label}-done`)
  return seen
}

async function main(): Promise<void> {
  const log: string[] = []
  const [a, b] = await Promise.all([drain('a', 3, log), drain('b', 2, log)])
  console.log(log.join(' '))
  console.log(`counts:${a},${b}`)
}
main()
//! expect: a0 b0 a1 b1 b-done a2 a-done
//! expect: counts:3,2
