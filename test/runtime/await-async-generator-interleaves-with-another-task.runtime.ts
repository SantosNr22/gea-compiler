// AN ASYNC GENERATOR DRIVEN BY FOR-AWAIT INTERLEAVES WITH ANOTHER ASYNC TASK,
// AND AN EARLY `break` RUNS THE GENERATOR'S `finally` -- WHICH ITSELF AWAITS.
//
// Every `yield` in an async generator is an await of the yielded value plus a
// resolution of the pending `next()` promise (27.6.3.8 AsyncGeneratorYield),
// and every `for await` step awaits that promise: each hop is a job, so a
// concurrent task's steps land between the generator's. `break` calls
// `return()` (AsyncIteratorClose), which resumes the generator at its `yield`
// with a return completion, runs `finally` -- including its awaits -- and only
// then lets the loop exit.
//
// The blocking model drove the generator body synchronously inside the
// consumer's `next()` pump, so the `other` task's steps did not interleave
// with the generator's yields, and the finally's await nested another pump.
// Observed on the blocking build (`other` runs only after the loop is over):
//   gen:yield0 got0 gen:resumed0 gen:yield1 got1 gen:resumed1 gen:yield2 got2
//   gen:finally-start gen:finally-end after-loop other0 other1 ... other7
const log: string[] = []

async function* numbers(): AsyncGenerator<number> {
  try {
    for (let i = 0; i < 5; i++) {
      log.push(`gen:yield${i}`)
      yield i
      log.push(`gen:resumed${i}`)
    }
  } finally {
    log.push('gen:finally-start')
    await null
    log.push('gen:finally-end')
  }
}

async function other(): Promise<void> {
  for (let i = 0; i < 8; i++) {
    log.push(`other${i}`)
    await null
  }
}

async function consume(): Promise<number> {
  let total = 0
  for await (const value of numbers()) {
    log.push(`got${value}`)
    total += value
    if (value === 2) break
  }
  log.push('after-loop')
  return total
}

async function main(): Promise<void> {
  const consuming = consume()
  const othering = other()
  const total = await consuming
  await othering
  console.log(log.join(' '))
  console.log(`total:${total}`)
}

main()
//! expect: gen:yield0 other0 other1 got0 gen:resumed0 gen:yield1 other2 other3 got1 gen:resumed1 gen:yield2 other4 other5 got2 other6 gen:finally-start other7 gen:finally-end after-loop
//! expect: total:3
