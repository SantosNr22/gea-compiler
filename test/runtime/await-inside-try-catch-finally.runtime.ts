// AWAIT IN EVERY PART OF A TRY STATEMENT: THE BODY, THE HANDLER, THE FINALLY.
//
// An async function is a C++20 coroutine, and C++ forbids `co_await` inside a
// `catch` handler and inside a lambda -- the scope guard that runs a finally
// clause is one. So a handler that awaits runs after the try statement under a
// flag, and a finally clause that awaits runs inline, with every way out of
// the try statement (fall-through, `return`, a throw)
// rerouted through it and resumed afterwards. Each case below takes a
// different one of those exits, and a sibling task interleaves with all of
// them to prove each await really suspends.
const log: string[] = []

async function tick(label: string): Promise<string> {
  await null
  log.push(label)
  return label
}

async function fail(message: string): Promise<number> {
  await null
  throw new Error(message)
}

async function bodyAwaits(): Promise<string> {
  try {
    const value = await tick('body')
    return `body:${value}`
  } catch (error) {
    return 'unreachable'
  }
}

async function handlerAwaits(): Promise<string> {
  try {
    await fail('boom')
    return 'unreachable'
  } catch (error) {
    const seen = await tick('handler')
    return `handler:${seen}:${(error as Error).message}`
  }
}

async function finallyAwaitsOnReturn(): Promise<string> {
  try {
    return await tick('try-return')
  } finally {
    await tick('finally-after-return')
  }
}

async function finallyAwaitsOnThrow(): Promise<string> {
  try {
    await fail('inner')
    return 'unreachable'
  } finally {
    await tick('finally-after-throw')
  }
}

async function finallyAwaitsInLoop(): Promise<number> {
  let total = 0
  for (let i = 0; i < 4; i++) {
    if (i === 3) break
    try {
      if (i !== 1) total += await fail('never').catch(() => 10 + i)
    } finally {
      await tick(`loop-finally-${i}`)
    }
  }
  return total
}

async function handlerRethrowsThroughFinally(): Promise<string> {
  try {
    try {
      await fail('first')
    } catch (error) {
      await tick('rethrow-handler')
      throw new Error(`second after ${(error as Error).message}`)
    } finally {
      await tick('rethrow-finally')
    }
  } catch (error) {
    return (error as Error).message
  }
  return 'unreachable'
}

async function nestedFinallyReturns(flag: boolean): Promise<number> {
  try {
    try {
      if (flag) return await Promise.resolve(7)
      await tick('nested-no-return')
    } finally {
      await tick('inner-finally')
    }
    return 1
  } finally {
    await tick('outer-finally')
  }
}

async function handlerAwaitsInLoop(): Promise<string> {
  const seen: string[] = []
  for (let i = 0; i < 3; i++) {
    try {
      if (i !== 1) await fail(`f${i}`)
      seen.push(`ok${i}`)
    } catch (error) {
      seen.push(await tick(`catch-${(error as Error).message}`))
    }
  }
  return seen.join(',')
}

async function sibling(): Promise<void> {
  for (let i = 0; i < 6; i++) await tick(`s${i}`)
}

async function main(): Promise<void> {
  const other = sibling()
  console.log(await bodyAwaits())
  console.log(await handlerAwaits())
  console.log(await finallyAwaitsOnReturn())
  try {
    await finallyAwaitsOnThrow()
  } catch (error) {
    console.log(`caught:${(error as Error).message}`)
  }
  console.log(`loop:${await finallyAwaitsInLoop()}`)
  console.log(await handlerRethrowsThroughFinally())
  console.log(`nested:${await nestedFinallyReturns(true)},${await nestedFinallyReturns(false)}`)
  console.log(await handlerAwaitsInLoop())
  await other
  console.log(log.join(' '))
}

main()
//! expect: body:body
//! expect: handler:handler:boom
//! expect: try-return
//! expect: caught:inner
//! expect: loop:22
//! expect: second after first
//! expect: nested:7,1
//! expect: catch-f0,ok1,catch-f2
//! expect: s0 body s1 s2 handler s3 s4 try-return s5 finally-after-return finally-after-throw loop-finally-0 loop-finally-1 loop-finally-2 rethrow-handler rethrow-finally inner-finally outer-finally nested-no-return inner-finally outer-finally catch-f0 catch-f2
