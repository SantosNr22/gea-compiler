// `await x` where `x`'s static type is `string | Promise<string>` -- the same
// shape `promise-resolve-over-a-thenable-union.ts` exercises for
// `Promise.resolve`, asked here of a bare `await` instead. ECMA-262 27.7.5.3's
// Await always wraps its operand in `PromiseResolve` and resumes from exactly
// one queued job, whichever arm is live -- so `relayAwait` below (an `await`
// of a union whose live arm this call happens to be a plain value) must
// resume on the same microtask turn as `plainAwait` (an ordinary `await` of
// that same value with no union in sight), and their `.then()` reactions --
// registered back-to-back, `relayAwait`'s first -- must fire in that
// registration order.
//
// Before this fix, a plain-value arm was routed through `Promise<string>`'s
// converting constructor before being awaited, which is an extra, already-
// fulfilled promise wrapping an already-fulfilled promise: `PromiseAwaiter`
// then queued its OWN resume job against a promise that itself only became
// settled by way of a queued adoption job, landing `relayAwait` one
// microtask tick behind `plainAwait` instead of resuming on the single tick
// every `await` costs.
async function relayAwait(x: string | Promise<string>): Promise<string> {
  const value = await x
  return value
}

async function plainAwait(x: string): Promise<string> {
  const value = await x
  return value
}

async function main(): Promise<void> {
  const order: string[] = []
  const p1 = relayAwait('r').then(() => order.push('relayAwait'))
  const p2 = plainAwait('p').then(() => order.push('plainAwait'))
  // Sequential awaits, not `Promise.all([p1, p2])`: a two-element array
  // literal infers as a fixed-arity tuple, and `PromiseConstructor::all`'s
  // emission for a tuple-typed argument is a separate, pre-existing defect
  // (a genuine type mismatch between the tuple result and the homogeneous
  // array `.all()` builds) unrelated to this file's own fix. Awaiting each
  // promise in turn reaches the same final ordering: `p1` settles inside the
  // job that runs `order.push('relayAwait')`, `p2` inside the very next
  // queued job, so both are already settled by the time `console.log` runs
  // either way -- this sidesteps the tuple bug without touching what this
  // test pins.
  await p1
  await p2
  console.log(order.join(','))

  // The promise arm still suspends on the real promise (a pending source
  // resumes the awaiter only once IT settles, never early).
  let unlock: (() => void) | null = null
  const gate = new Promise<void>((resolve) => {
    unlock = resolve
  })
  const viaPromise = (async (pending: Promise<void>): Promise<string> => {
    const settled = await relayAwait(pending.then(() => 'from-promise-arm'))
    return settled
  })(gate)
  let sawResult = false
  viaPromise.then((value) => {
    sawResult = true
    console.log('adopted:' + value)
  })
  console.log('before-unlock:' + sawResult)
  unlock!()
  await viaPromise
}

main()

//! expect: relayAwait,plainAwait
//! expect: before-unlock:false
//! expect: adopted:from-promise-arm
