//! expect: a=1
//! expect: shared=false
//! emitted-lacks: sharedEmptyRef
// The same default, but written through: every holder of a shared empty record
// would then see `a`. Each evaluation must keep its own object, so the
// allocation stays a real one (`ir/shared-empty-records.ts` refuses a record
// that is the receiver of a store, however far it has travelled).
interface Settings {
  retries?: number
  label?: string
}
const withRetries = (given?: Settings): Settings => {
  const settings = given ?? {}
  settings.retries = 1
  return settings
}
const first = withRetries()
console.log(`a=${first.retries}`)
console.log(`shared=${withRetries() === first}`)
