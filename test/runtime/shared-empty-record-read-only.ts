//! expect: plain=0
//! expect: given=5
//! expect: same=true
//! emitted-has: sharedEmptyRef
// `inherit ?? {}` only exists so the reads after it need no absence test. The
// default is read here and by the callee it is handed to, never written,
// stored, returned or compared by identity, so every evaluation may share the
// one immutable empty record (`ir/shared-empty-records.ts`).
interface Settings {
  retries?: number
  label?: string
}
const retriesOf = (settings: Settings): number => settings.retries ?? 0
const resolve = (given?: Settings): number => {
  const settings = given ?? {}
  return retriesOf(settings) + (settings.label === undefined ? 0 : 0)
}
console.log(`plain=${resolve()}`)
console.log(`given=${resolve({ retries: 5 })}`)
const again = (given?: Settings): number => retriesOf(given ?? {})
console.log(`same=${again() === resolve()}`)
