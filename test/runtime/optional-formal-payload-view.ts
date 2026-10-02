//! expect: len=3
//! expect: after=3
//! emitted-lacks: = (*gea_arg_0);
// The payload of a borrowed optional formal is read in place; the caller's slot stays untouched.
// A callee that can overwrite the source keeps its by-value formal, so the payload stays alive.
class Slot {
  label: string[] | undefined = ['a', 'b', 'c']
}
const slot = new Slot()
const count = (items: string[] | undefined): number => {
  if (items === undefined) return -1
  return items.length
}
const clobber = (items: string[] | undefined): number => {
  slot.label = undefined
  if (items === undefined) return -1
  return items.length
}
console.log(`len=${count(slot.label)}`)
console.log(`after=${clobber(slot.label)}`)
