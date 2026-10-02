// AN ASYNC FRAME OWNS WHAT IT READS AFTER A SUSPENSION.
//
// An async function is a C++20 coroutine: its frame outlives the call that
// started it, and every `await` returns to the caller before the body resumes
// from a promise job. So its parameters, its receiver and its captured cells
// must be the frame's own -- a reference to the caller's argument, or to the
// environment a thunk unpacked on its own stack, would dangle by the time the
// body resumes. Each case reads one of them after an await, while a sibling
// task mutates the shared state in between; and a rejection travels to the
// caller's `try` through several suspended frames.
const log: string[] = []

class Account {
  owner: string
  balance: number
  constructor(owner: string, opening: number) {
    this.owner = owner
    this.balance = opening
  }

  async deposit(amount: number, note: string): Promise<string> {
    await null
    this.balance += amount
    await null
    return `${this.owner}:${this.balance}:${note}`
  }

  async withdraw(amount: number): Promise<number> {
    await null
    if (amount > this.balance) throw new Error(`${this.owner} overdrawn by ${amount - this.balance}`)
    this.balance -= amount
    return this.balance
  }
}

async function sum(values: number[]): Promise<number> {
  let total = 0
  for (const value of values) {
    total += await Promise.resolve(value)
    log.push(`sum+${value}`)
  }
  return total
}

async function counting(label: string, limit: number): Promise<number> {
  let count = 0
  while (count < limit) {
    await null
    count++
    log.push(`${label}${count}`)
  }
  return count
}

function makeCounter(prefix: string): () => Promise<string> {
  let hits = 0
  const seen: string[] = []
  return async () => {
    hits++
    const mine = hits
    await null
    seen.push(`${prefix}${mine}`)
    return `${prefix}:${mine}/${hits}:${seen.join('+')}`
  }
}

async function transfer(from: Account, to: Account, amount: number): Promise<string> {
  const left = await from.withdraw(amount)
  const receipt = await to.deposit(amount, 'transfer')
  return `${left} ${receipt}`
}

async function main(): Promise<void> {
  const account = new Account('ann', 10)
  const pending = account.deposit(5, 'first')
  account.balance = 100
  console.log(await pending)

  const background = counting('c', 3)
  console.log(`sum:${await sum([1, 2, 3])}`)
  await background
  console.log(log.join(' '))

  const counter = makeCounter('k')
  const first = counter()
  const second = counter()
  console.log(await first)
  console.log(await second)

  const bob = new Account('bob', 3)
  try {
    await transfer(bob, account, 50)
    console.log('unreachable')
  } catch (error) {
    console.log(`caught:${(error as Error).message}`)
  }
  const outcome = await transfer(account, bob, 5).then(
    (value) => `ok:${value}`,
    () => 'rejected'
  )
  console.log(outcome)
  const rejected = await bob.withdraw(1000).catch((error: Error) => `handled:${error.message}`)
  console.log(rejected)
}

main()
//! expect: ann:105:first
//! expect: sum:6
//! expect: c1 sum+1 c2 sum+2 c3 sum+3
//! expect: k:1/2:k1
//! expect: k:2/2:k1+k2
//! expect: caught:bob overdrawn by 47
//! expect: ok:100 bob:8:transfer
//! expect: handled:bob overdrawn by 992
