// A single BOXED capture -- a `let` reassigned after the closures capture it
// -- is still exactly one field (a `gea::Ref` to the shared box), so it also
// qualifies for the single-ref fast path. Two closures sharing the same box
// must still see each other's writes: mutation visibility must not depend on
// whether the environment happened to need a `HeapEnvironmentBlock`.
function makeBoxPair(): { setter: (next: { n: number }) => void; getter: () => number } {
  let obj: { n: number } = { n: 1 }
  const setter = (next: { n: number }): void => {
    obj = next
  }
  const getter = (): number => obj.n
  return { setter, getter }
}

const { setter, getter } = makeBoxPair()
console.log(getter())
setter({ n: 99 })
console.log(getter())

//! expect: 1
//! expect: 99
