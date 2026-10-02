// A record literal built for a union-typed cell -- `opts = { w: options }`
// in the driver's `WriteConcern.fromOptions` -- is filled through its own
// handle and then widened into the cell's union: the widening takes the
// handle over instead of retaining it a second time.
'use strict'
class Concern {
  constructor(public readonly w: number) {}
}
type Settings = { w?: number | string; journal?: boolean }
const describe = (source: Settings | Concern | undefined): string => {
  if (source === undefined) return 'none'
  if (source instanceof Concern) return 'C' + source.w
  return 'S' + String(source.w ?? '-') + (source.journal === true ? 'j' : '')
}
const fromOptions = (options: number | string | Concern | undefined): string => {
  let opts: Settings | Concern | undefined
  if (typeof options === 'string' || typeof options === 'number') {
    opts = { w: options }
  } else {
    opts = options
  }
  return describe(opts)
}
console.log(fromOptions(1), fromOptions('majority'), fromOptions(new Concern(2)), fromOptions(undefined))
//! expect: S1 Smajority C2 none
