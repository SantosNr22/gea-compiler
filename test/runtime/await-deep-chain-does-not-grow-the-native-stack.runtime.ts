// TEN THOUSAND AWAITS THAT EACH SUSPEND WHILE OTHER WORK IS PENDING.
//
// A suspended async function holds its state in its own frame object, not on
// the machine stack: resuming it from the job queue starts from an empty
// stack every time, so the depth of an await chain costs heap, never stack.
//
// The blocking model lowered `await p` to `p.awaited()`, a reactor pump on
// the C++ stack that returns only once `p` settles. Two shapes follow:
//
//  * `nested`: 10,000 `then` jobs, job `i` starting `waiter(i)` -- whose
//    await is pending until job `i + 1` releases it. Under the pump model job
//    0's waiter pumps, which runs job 1, whose waiter pumps, ... 10,000 pumps
//    deep on one C++ stack. Under real suspension each waiter returns to its
//    job at the await and the stack never deepens.
//  * `loops`: three loops of 10,000 async calls each, started together. Real
//    suspension interleaves them (`a0 b0 c0 a9999 b9999 c9999`); the pump model
//    ran each loop to completion before the next one began
//    (`a0 a9999 b0 b9999 c0 c9999`).
//
// Observed on a mid-migration build whose runtime already refuses a nested
// pump: `totals` right, `trace:a0 a9999 b0 b9999 c0 c9999`, then
//   gea: blocking await (Promise::awaited / waitForPromise) entered inside a
//   Promise job, timer or I/O callback (callback depth 1). ...
//   CRASHED: SIGABRT
const STEPS = 10000

// ---- nested ---------------------------------------------------------------

const release: Array<() => void> = []
let released = 0

async function waiter(i: number): Promise<void> {
  await new Promise<void>((resolve) => {
    release.push(resolve)
  })
  released += 1
  if (released === STEPS) console.log(`nested:released=${released} last=${i}`)
}

const start = Promise.resolve()
for (let i = 0; i < STEPS; i++) {
  start.then(() => {
    waiter(i)
    if (i > 0) release[i - 1]!()
    if (i === STEPS - 1) release[i]!()
  })
}

// ---- loops ----------------------------------------------------------------

async function step(i: number): Promise<number> {
  const value = await Promise.resolve(i % 7)
  return value
}

async function loop(name: string, trace: string[]): Promise<number> {
  let total = 0
  for (let i = 0; i < STEPS; i++) {
    total += await step(i)
    if (i === 0 || i === STEPS - 1) trace.push(`${name}${i}`)
  }
  return total
}

async function main(): Promise<void> {
  const trace: string[] = []
  const a = loop('a', trace)
  const b = loop('b', trace)
  const c = loop('c', trace)
  const totals = [await a, await b, await c]
  console.log(`totals:${totals.join(',')}`)
  console.log(`trace:${trace.join(' ')}`)
}

main()
//! expect: nested:released=10000 last=9999
//! expect: totals:29994,29994,29994
//! expect: trace:a0 b0 c0 a9999 b9999 c9999
