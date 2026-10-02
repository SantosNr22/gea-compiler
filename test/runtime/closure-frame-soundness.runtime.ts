// What a per-call frame must not change: a variable written after a closure
// captured it stays shared, a binding minted per loop iteration stays
// distinct, a function keeps its identity wherever the program observes it,
// and a closure that reaches the frame through another closure still sees it.
type Counter = () => number

function shared(): string {
  let total = 0
  let log = ''
  const add = (amount: number): number => {
    total += amount
    log += '+' + amount
    return total
  }
  const read: Counter = () => total
  const twice = (amount: number): number => add(amount) + add(amount)
  // Written after every closure above captured it.
  total = 100
  const afterwards = twice(1)
  return [read(), afterwards, log].join(',')
}
//! expect: 102,203,+1+1
console.log(shared())

function perIteration(count: number): string {
  let tally = 0
  const record = (value: number): number => {
    tally += value
    return tally
  }
  const closures: Counter[] = []
  for (let index = 0; index < count; index++) {
    // `own` and `index` are minted again each time round.
    let own = index * 10
    closures.push(() => {
      own += 1
      return own + record(index)
    })
  }
  const out: number[] = []
  for (const closure of closures) out.push(closure())
  for (const closure of closures) out.push(closure())
  out.push(tally)
  return out.join(',')
}
//! expect: 1,12,24,5,16,28,6
console.log(perIteration(3))

function identity(): string {
  let calls = 0
  const handler = (): number => ++calls
  const other = (): number => ++calls
  const table = new Map<() => number, string>()
  table.set(handler, 'handler')
  table.set(other, 'other')
  const alias = handler
  handler()
  other()
  return [alias === handler, alias === other, table.get(alias), table.get(other), calls].join(',')
}
//! expect: true,false,handler,other,2
console.log(identity())

function nested(): string {
  let depth = 0
  const bump = (): number => ++depth
  const outer = (): (() => number) => {
    const inner = (): number => bump() * 10 + depth
    return inner
  }
  const run = outer()
  depth = 5
  return [run(), run(), depth].join(',')
}
//! expect: 66,77,7
console.log(nested())

function selfReferencing(): string {
  let remaining = 3
  let trail = ''
  const step = (): string => {
    trail += remaining
    remaining--
    return remaining > 0 ? step() : trail
  }
  return step() + '/' + remaining
}
//! expect: 321/0
console.log(selfReferencing())

async function awaited(): Promise<string> {
  let seen = 0
  let notes = ''
  const note = (text: string): void => {
    seen++
    notes += text
  }
  await Promise.resolve()
  note('a')
  await Promise.resolve()
  note('b')
  return notes + seen
}
awaited().then((value) => {
  //! expect: ab2
  console.log(value)
})

function* generated(): Generator<number> {
  let produced = 0
  const next = (): number => ++produced
  yield next()
  yield next()
  yield produced
}
//! expect: 1,2,2
console.log([...generated()].join(','))
