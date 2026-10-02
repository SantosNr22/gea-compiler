// The Promise executor is invoked exactly once, synchronously, inside the
// constructor (`gea::host::PromiseConstructor::VoidExecutorRunner`), and is
// never stored anywhere -- so its own environment, capturing several locals
// from the enclosing frame, may be a stack-resident borrow
// (`gea::packBorrowedEnvironment`) instead of a `gea::HeapEnvironmentBlock`.
//
// A SEPARATE closure allocated INSIDE the executor's own body, over one of
// the SAME captured cells, and RETAINED past the executor's return (pushed
// onto an array the way a real callback would be handed to a timer or an
// event target) must keep its own heap environment regardless -- the borrow
// and the retained closure's own cell are independent lifetimes.
const queued: Array<() => void> = []

function schedule(label: string): Promise<number> {
  let counter = 0
  return new Promise<number>((resolve) => {
    // Two captures from `schedule`'s frame: `counter` (mutated, boxed) and
    // `label` (plain) -- never `SoleRefField`-shaped, so this is exactly the
    // multi-field shape that used to mean a `HeapEnvironmentBlock`.
    counter += 1
    console.log(label, counter)
    const bump = () => {
      counter += 1
      resolve(counter)
    }
    queued.push(bump)
  })
}

async function run(): Promise<void> {
  const promise = schedule('run')
  while (queued.length > 0) {
    const next = queued.shift()!
    next()
  }
  console.log('settled', await promise)
}

run()

//! expect: run 1
//! expect: settled 2
//! emitted-has: gea::packBorrowedEnvironment
