// An async generator that waits on a timer between yields while another task
// keeps running: the generator's frame suspends at each `await sleep(...)`
// and the consumer's `for await` suspends on the step, so the ticker's own
// timers keep firing in between. Nothing blocks: every wait is a suspension
// the event queue resumes.
//
// This suite's target has no `setTimeout`, so the timers are a program-owned
// queue in virtual time, driven from the top level.
interface Timer {
  due: number
  order: number
  run: () => void
}

const trace: string[] = []
const timers: Timer[] = []
let now = 0
let scheduled = 0

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    timers.push({ due: now + ms, order: scheduled, run: () => resolve() })
    scheduled += 1
  })
}

function takeNextTimer(): Timer | undefined {
  let best = -1
  for (let i = 0; i < timers.length; i++) {
    const candidate = timers[i]!
    const current = best < 0 ? undefined : timers[best]!
    if (current === undefined || candidate.due < current.due || (candidate.due === current.due && candidate.order < current.order)) best = i
  }
  if (best < 0) return undefined
  return timers.splice(best, 1)[0]
}

async function settleJobs(): Promise<void> {
  for (let i = 0; i < 64; i++) await null
}

async function* slowNumbers(): AsyncGenerator<number, string> {
  for (let i = 1; i <= 3; i++) {
    await sleep(10)
    trace.push(`gen:yield ${i} at ${now}`)
    yield i
  }
  return 'finished'
}

async function consume(): Promise<void> {
  let total = 0
  for await (const value of slowNumbers()) {
    trace.push(`consume:${value} at ${now}`)
    total += value
  }
  trace.push(`consume:total ${total} at ${now}`)
}

async function ticker(): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await sleep(7)
    trace.push(`tick:${i} at ${now}`)
  }
}

async function main(): Promise<void> {
  const work = Promise.all([consume(), ticker()])
  await settleJobs()
  for (;;) {
    const timer = takeNextTimer()
    if (timer === undefined) break
    now = timer.due
    timer.run()
    await settleJobs()
  }
  await work
  trace.push('main:done')
  // One line, so the expectation pins the ORDER, not just the presence.
  console.log(trace.join(' | '))
}
main()
//! expect: tick:0 at 7 | gen:yield 1 at 10 | consume:1 at 10 | tick:1 at 14 | gen:yield 2 at 20 | consume:2 at 20 | tick:2 at 21 | tick:3 at 28 | gen:yield 3 at 30 | consume:3 at 30 | consume:total 6 at 30 | main:done
