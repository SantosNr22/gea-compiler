// `await` OF AN ALREADY-RESOLVED PROMISE, OR OF A NON-THENABLE, STILL YIELDS.
//
// 27.7.5.3 Await wraps its operand with PromiseResolve and always attaches a
// reaction: the continuation is a job even when the value is already there.
// Code after the call site of the async function runs BEFORE the body resumes,
// and a settled await never lets one function overtake another's queued job.
//
// The blocking model's `.awaited()` on an already-settled promise returned the
// value immediately, without yielding at all, so each body ran straight
// through before its caller continued. Observed on the blocking build:
//   f:start f:after-number:42 f:after-resolved:x f:after-async-fn:7 f:end
//   sync-after-f g:start g:after-undefined g:after-null sync-after-g
const log: string[] = []

async function seven(): Promise<number> {
  return 7
}

async function f(): Promise<void> {
  log.push('f:start')
  const n = await 42
  log.push(`f:after-number:${n}`)
  const s = await Promise.resolve('x')
  log.push(`f:after-resolved:${s}`)
  const v = await seven()
  log.push(`f:after-async-fn:${v}`)
  log.push('f:end')
}

async function g(): Promise<void> {
  log.push('g:start')
  await undefined
  log.push('g:after-undefined')
  await null
  log.push('g:after-null')
}

async function main(): Promise<void> {
  const p = f()
  log.push('sync-after-f')
  const q = g()
  log.push('sync-after-g')
  await p
  await q
  console.log(log.join(' '))
}

main()
//! expect: f:start sync-after-f g:start sync-after-g f:after-number:42 g:after-undefined f:after-resolved:x g:after-null f:after-async-fn:7 f:end
