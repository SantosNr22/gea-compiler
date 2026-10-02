// A negative case: the executor is built in one function, RETURNED, and
// passed to `new Promise` somewhere else entirely -- so its allocation's
// value is read through a `binding-read` at the construction site, never
// used directly there, and `ir/borrowed-callable-uses.ts` proves nothing
// about a value it never sees consumed by the construct in the same block.
// It must keep its ordinary (transient) environment.
function makeExecutor(shared: number[]): (resolve: (value: number) => void) => void {
  const executor = (resolve: (value: number) => void) => {
    shared.push(1)
    resolve(shared.length)
  }
  return executor
}

async function run(): Promise<void> {
  const shared: number[] = []
  const executor = makeExecutor(shared)
  const value = await new Promise<number>(executor)
  console.log('value', value, 'shared', shared.length)
}

run()

//! expect: value 1 shared 1
//! emitted-lacks: gea::packBorrowedEnvironment
//! emitted-has: gea::packTransientEnvironment
