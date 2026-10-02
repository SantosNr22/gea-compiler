// A fresh record read in place (field stores through it, an `instanceof`
// test, a receiver) and then handed over once -- widened into a union,
// stored into a cell, passed as an argument -- moves at that one handover,
// including inside a `try`. A value a loop reads again after its handover,
// or one handed over on one branch and read on another, keeps its copy.
'use strict'
class Concern {
  constructor(public readonly w: number) {}
}
type Settings = { w?: number; journal?: boolean }
type Source = Settings | Concern
const describe = (source: Source): string =>
  source instanceof Concern ? 'C' + source.w : 'S' + (source.w ?? '-') + (source.journal === true ? 'j' : '')
const fromOptions = (w: number | undefined, journal: boolean): Source => {
  const settings: Settings = {}
  if (w !== undefined) settings.w = w
  settings.journal = journal
  const merged: Source = settings
  return merged
}
let log = ''
log += describe(fromOptions(1, true)) + ' '
log += describe(fromOptions(undefined, false)) + ' '
let held: Source | null = null
const keep = (source: Source): void => {
  held = source
}
const twice = (): string => {
  const settings: Settings = { w: 3 }
  let out = ''
  for (let round = 0; round < 3; round += 1) {
    settings.w = (settings.w ?? 0) + 1
    keep(settings)
    out += describe(held ?? settings)
  }
  return out
}
log += twice() + ' '
const branchy = (flag: boolean): string => {
  const settings: Settings = { w: 7, journal: flag }
  if (flag) {
    keep(settings)
    return describe(held ?? settings)
  }
  return describe(settings) + describe(settings)
}
log += branchy(true) + branchy(false) + ' '
const guarded = (fail: boolean): string => {
  const concern = new Concern(9)
  try {
    if (fail) throw new Error('x')
    keep(concern)
    return describe(held ?? concern)
  } catch {
    return 'caught' + describe(concern)
  }
}
log += guarded(false) + guarded(true)
console.log(log)
//! expect: S1j S- S4S5S6 S7jS7S7 C9caughtC9
