// A REJECTION PROPAGATES THROUGH SEVERAL AWAITS; A FINALLY MAY ITSELF AWAIT.
//
// Each `await` of a rejected promise throws at the await point (27.7.5.3 step
// 5, the rejected-reaction closure), so a throw three calls deep surfaces in
// the outermost `try`/`catch`. A `finally` that awaits suspends the function
// between the throw and its propagation -- other work runs in that gap -- and
// then the ORIGINAL completion (the throw, or the `return` value) resumes.
//
// The blocking model resumed nothing: each await pumped in place, so the
// ticker ran to completion before `level1` even started. Observed on the
// blocking build:
//   tick0 tick1 tick2 tick3 tick4 tick5 l3:throw l1:finally-start
//   l1:finally-mid l1:finally-end caught:boom kept:finally kept:kept
const log: string[] = []

async function level3(): Promise<number> {
  await null
  log.push('l3:throw')
  throw new Error('boom')
}

async function level2(): Promise<number> {
  const value = await level3()
  log.push('l2:unreachable')
  return value + 1
}

async function level1(): Promise<number> {
  try {
    return await level2()
  } finally {
    log.push('l1:finally-start')
    await Promise.resolve()
    log.push('l1:finally-mid')
    await null
    log.push('l1:finally-end')
  }
}

async function keepsReturnValue(): Promise<string> {
  try {
    return 'kept'
  } finally {
    await null
    log.push('kept:finally')
  }
}

async function ticker(): Promise<void> {
  for (let i = 0; i < 6; i++) {
    log.push(`tick${i}`)
    await null
  }
}

async function main(): Promise<void> {
  const ticking = ticker()
  try {
    await level1()
    log.push('main:unreachable')
  } catch (error) {
    log.push(`caught:${(error as Error).message}`)
  }
  const kept = await keepsReturnValue()
  log.push(`kept:${kept}`)
  await ticking
  console.log(log.join(' '))
}

main()
//! expect: tick0 tick1 l3:throw tick2 tick3 l1:finally-start tick4 l1:finally-mid tick5 l1:finally-end caught:boom kept:finally kept:kept
