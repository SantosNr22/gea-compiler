//! expect: logged 1
//! expect: absent after log
//! emitted-once: if (!(true)) goto

// The other half of `narrowed-mutable-read-after-a-call-is-not-trusted`: a
// call only takes a narrowing back when it can reach a write of the narrowed
// reference. `note` writes a counter, never `slot`, so the checker's
// `undefined` after `holder.slot == null` still holds across it and the
// inner test still folds.

class Holder {
  slot: string | undefined
  reset(): void {
    this.slot = undefined
  }
}

let logged = 0
function note(): void {
  logged++
}

function across(holder: Holder): string {
  if (holder.slot == null) {
    note()
    if (holder.slot == null) return 'absent after log'
    return `present ${holder.slot}`
  }
  return 'preset'
}

const holder = new Holder()
holder.reset()
const answer = across(holder)
console.log(`logged ${logged}`)
console.log(answer)
