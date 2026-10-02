// AN ASYNC METHOD IMPLEMENTING A MEMBER TYPED `PromiseLike<number>`.
//
// An async function always returns a real promise (ECMA-262 27.7.5.1), whatever
// its contextual interface says, and `PromiseLike<T>` derives as that same
// promise carrier, so the body's promise flows into the slot unchanged. The
// caller awaits through the interface and must wait for the body's own awaits,
// see its rejection, and interleave with a sibling task exactly as node does.
// `AsyncDisposable[Symbol.asyncDispose]` is the lib's own `PromiseLike<void>`
// member, reached here from an object literal.
interface Source {
  read(delta: number): PromiseLike<number>
}

const log: string[] = []

async function tick(label: string): Promise<void> {
  await null
  log.push(label)
}

class Counter implements Source {
  total = 0
  async read(delta: number): Promise<number> {
    await tick(`read-${delta}`)
    if (delta < 0) throw new Error(`negative ${delta}`)
    this.total += delta
    return this.total
  }
}

const literal: Source & AsyncDisposable = {
  async read(delta: number) {
    await tick(`literal-${delta}`)
    return delta * 10
  },
  async [Symbol.asyncDispose]() {
    await tick('dispose')
  }
}

// A member typed `(): void` discards the promise, but the body still suspends
// and resumes from jobs; the caller moves on at its first await.
interface Runner {
  run(label: string): void
}

const runner: Runner = {
  async run(label: string) {
    await tick(`run-${label}`)
    log.push(`ran-${label}`)
  }
}

async function sibling(): Promise<void> {
  for (let i = 0; i < 4; i++) await tick(`s${i}`)
}

async function main(): Promise<void> {
  const other = sibling()
  const source: Source = new Counter()
  console.log(`first:${await source.read(2)}`)
  console.log(`second:${await source.read(3)}`)
  try {
    await source.read(-1)
    console.log('no-error')
  } catch (error) {
    console.log(`rejected:${(error as Error).message}`)
  }
  runner.run('x')
  console.log(`literal:${await literal.read(4)}`)
  await literal[Symbol.asyncDispose]()
  console.log('disposed')
  await other
  console.log(log.join(' '))
}

main()
//! expect: first:2
//! expect: second:5
//! expect: rejected:negative -1
//! expect: literal:40
//! expect: disposed
//! expect: s0 read-2 s1 read-3 s2 s3 read--1 run-x literal-4 ran-x dispose
