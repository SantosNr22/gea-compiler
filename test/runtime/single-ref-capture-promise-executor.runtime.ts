// A `new Promise((resolve) => ...)` executor whose only capture is the
// receiver alone: a synchronous, non-escaping single-ref-capture closure that
// the host (`gea::host::PromiseConstructor`) calls exactly once, immediately.
class Service {
  value: number
  constructor(value: number) {
    this.value = value
  }
  fetch(): Promise<number> {
    return new Promise((resolve) => {
      resolve(this.value)
    })
  }
}

async function run(): Promise<void> {
  const s = new Service(42)
  const v = await s.fetch()
  console.log(v)
}
run()

//! expect: 42
