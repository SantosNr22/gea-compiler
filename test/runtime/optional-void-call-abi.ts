// A short-circuited call produces undefined, but its present branch must call
// the actual void-returning method through that method's native ABI.
let calls = 0

interface Actions {
  required(): void
  optional?: () => void
}

function invoke(actions: Actions | null): void {
  actions?.required()
  actions?.optional?.()
}

invoke(null)
console.log(calls)
//! expect: 0

invoke({
  required: () => {
    calls += 1
  }
})
console.log(calls)
//! expect: 1

invoke({
  required: () => {
    calls += 1
  },
  optional: () => {
    calls += 10
  }
})
console.log(calls)
//! expect: 12

// Concise arrows consume the merged expression result even when the callback
// returns void. Both branches return undefined; only the present one calls it.
function concise(actions: Actions): void {
  const invoke = () => actions.optional?.()
  console.log(invoke())
}

concise({ required: () => {} })
//! expect: undefined
concise({
  required: () => {},
  optional: () => {
    calls += 100
  }
})
//! expect: undefined
console.log(calls)
//! expect: 112
