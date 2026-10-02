// A class extending `Promise<number>` with NO written constructor: the implicit
// `constructor(...args) { super(...args) }` forwards the executor to the native
// promise base (ECMA-262 27.2.3.1), field initializers run after it, and the
// instance settles `await`, `then`, `Promise.all` and `Promise.race` as the
// promise it IS -- while its own fields and methods stay the class's.
class Answer extends Promise<number> {
  label = 'answer'
  describe(): string {
    return `${this.label}!`
  }
}

let settleLater: (value: number) => void = () => {}

async function main(): Promise<void> {
  const now = new Answer((resolve) => resolve(42))
  console.log(now.describe(), now instanceof Promise, await now)
  console.log(await now.then((value) => value + 1))
  const held: Promise<number> = now
  console.log(await held)

  const later = new Answer((resolve) => (settleLater = resolve))
  const raced = Promise.race([later, new Answer(() => {})])
  settleLater(7)
  console.log(await raced)

  const all = await Promise.all([now, later])
  console.log(all.length, all[0], all[1])

  const failing = new Answer(() => {
    throw new Error('executor threw')
  })
  try {
    await failing
  } catch (error) {
    console.log(error instanceof Error ? error.message : '?', failing.label)
  }
}
//! expect: answer! true 42
//! expect: 43
//! expect: 42
//! expect: 7
//! expect: 2 42 7
//! expect: executor threw answer
main()
