// The captured closure IS an async function (a coroutine of its own), and its
// only capture is the receiver alone. `coroutineEnvironmentPrologueOf`
// copies the thunk's transient, borrowed unpack into the coroutine's own
// by-value frame -- a REAL copy, with its own retained reference -- so the
// object must still be reachable across the `await` and across a SECOND call
// made after the only external handle to it was dropped.
class Resource {
  tag: string
  constructor(tag: string) {
    this.tag = tag
  }
  reader(): () => Promise<string> {
    return async () => {
      await Promise.resolve()
      return this.tag
    }
  }
}

async function run(): Promise<void> {
  let holder: Resource | null = new Resource('hi')
  const read = holder.reader()
  holder = null
  const a = await read()
  const b = await read()
  console.log(a, b)
}
run()

//! expect: hi hi
