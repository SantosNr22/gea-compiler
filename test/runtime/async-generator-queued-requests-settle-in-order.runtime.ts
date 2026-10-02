// Requests made to an async generator before any earlier one has settled wait
// in its queue (27.6.3.1 AsyncGeneratorEnqueue) and are answered in order: a
// `next()` per yield, a `return()` made while the body is suspended at a yield,
// and a `next()` after the generator completed. The queue keeps its head inline
// and only a second concurrent request touches the vector behind it, so five
// outstanding requests exercise both.
const log: string[] = []

async function* numbers(): AsyncGenerator<number, number, void> {
  try {
    yield 1
    yield 2
    yield 3
    return 0
  } finally {
    log.push('finally')
  }
}

async function* failing(): AsyncGenerator<number, void, void> {
  try {
    yield 1
    yield 2
  } catch (error) {
    log.push(`caught ${(error as Error).message}`)
    yield 99
  }
}

async function main(): Promise<void> {
  const gen = numbers()
  const first = gen.next()
  const second = gen.next()
  const third = gen.next()
  const closing = gen.return(7)
  const after = gen.next()
  const results: string[] = []
  for (const pending of [first, second, third, closing, after]) {
    const step = await pending
    results.push(results.length === 4 ? `after:${step.done}` : `${step.value}:${step.done}`)
  }
  console.log(results.join(' '))
  console.log(log.join(','))

  const thrower = failing()
  const one = thrower.next()
  const raised = thrower.throw(new Error('boom'))
  const rest = thrower.next()
  const seen: string[] = []
  for (const pending of [one, raised, rest]) {
    const step = await pending
    seen.push(`${step.value}:${step.done}`)
  }
  console.log(seen.join(' '))
  console.log(log.join(','))
}
main()
//! expect: 1:false 2:false 3:false 7:true after:true
//! expect: finally
//! expect: 1:false 99:false undefined:true
//! expect: finally,caught boom
