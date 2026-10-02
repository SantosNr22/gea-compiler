// A PENDING PROMISE READ AS A PROMISE OF ANOTHER PAYLOAD CARRIER.
//
// `const q: Promise<unknown> = p` is the same promise object in the language:
// a reaction registered on `q` and one registered on `p` sit in one list and
// run in registration order the moment it settles. Converting the payload
// carrier by adopting the source into a fresh promise puts a microtask hop
// between the two, so a reaction on the converted view ran AFTER one the
// program registered later on the source.

const order: string[] = []
let resolveSource: (value: string) => void = () => {}
const source = new Promise<string>((resolve) => {
  resolveSource = resolve
})
const view: Promise<unknown> = source
view.then(() => order.push('view'))
source.then(() => order.push('source'))
resolveSource('x')

// A rejection takes the same path.
let rejectSource: (reason: unknown) => void = () => {}
const failing = new Promise<string>((_, reject) => {
  rejectSource = reject
})
const failingView: Promise<unknown> = failing
failingView.catch(() => order.push('view-rejected'))
failing.catch(() => order.push('source-rejected'))
rejectSource(new Error('no'))

async function report(): Promise<void> {
  // Drain every job the settlements above queued, however many hops each takes.
  for (let turn = 0; turn < 8; turn++) await undefined
  console.log(`order=${order.join(',')}`)
}
report()
//! expect: order=view,source,view-rejected,source-rejected
