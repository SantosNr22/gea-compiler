//! emitted-lacks: shareEnvironment
// Closures that capture each other and a captured formal, all in one call: the
// frame holds the formal, the shared lets and the closures, so the recursion
// group needs no block of its own. Mutual recursion, a formal read after a
// closure captured it, and a sibling's identity must all survive.
function walk(limit: number, label: string[]): string {
  let steps = 0
  let trail = ''
  const even = (n: number): boolean => {
    steps++
    trail += label[0]
    return n === 0 ? true : odd(n - 1)
  }
  const odd = (n: number): boolean => {
    steps++
    trail += label[1]
    return n === 0 ? false : even(n - 1)
  }
  const first = even(limit)
  const again = even === even && odd !== even
  return [first, again, steps, trail, limit, label.join('')].join(',')
}
//! expect: true,true,5,eoeoe,4,eo
console.log(walk(4, ['e', 'o']))
//! expect: false,true,4,eoeo,3,eo
console.log(walk(3, ['e', 'o']))

function counterFor(start: number): () => number {
  let current = start
  const next = (): number => {
    current += start
    return current
  }
  const peek = (): number => current + start
  return () => next() + peek()
}
const counter = counterFor(2)
//! expect: 10
console.log(counter())
//! expect: 14
console.log(counter())
