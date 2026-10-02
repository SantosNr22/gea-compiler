// One closure of a convention is compared with `===`, so the convention is
// observed program-wide -- but only THAT closure's value reaches the
// comparison. The per-call closures of the same convention are called
// directly, handed to a promise reaction and passed to a directly called
// function that only calls them, so none of them needs a function object:
// exactly one `identifyCallable` may be emitted (the compared closure).
type Named = (name: string) => string
const listeners: Named[] = []
const remove = (fn: Named): boolean => {
  for (let i = 0; i < listeners.length; i++) {
    if (listeners[i] === fn) {
      listeners.splice(i, 1)
      return true
    }
  }
  return false
}
const applyTwice = (fn: Named, value: string): string => fn(fn(value))
async function work(prefix: string): Promise<string> {
  const decorate: Named = (name) => prefix + name
  const shout: Named = (name) => name + '!'
  const first = await Promise.resolve('a').then(decorate)
  return applyTwice(shout, first) + decorate('z')
}
const hello: Named = (name) => 'hello ' + name
listeners.push(hello)
async function main(): Promise<void> {
  console.log(remove(hello), listeners.length, await work('p:'))
}
void main()
export {}
