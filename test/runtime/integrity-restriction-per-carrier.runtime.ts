// Freezing reaches only the carriers the frozen argument can be: a Base-typed
// freeze of a Derived instance still guards Derived's stores, a frozen record
// shape guards its own stores, and an unrelated class keeps its plain stores.
'use strict'
class Base {
  value = 0
}
class Derived extends Base {
  extra = 0
}
class Unrelated {
  count = 0
}
interface Settings {
  level: number
}

const freezeBase = (object: Base): Base => Object.freeze(object)
const freezeSettings = (settings: Settings): Settings => Object.freeze(settings)

const derived = new Derived()
freezeBase(derived)
const attempt = (label: string, write: () => void): string => {
  try {
    write()
    return label + ':wrote'
  } catch (error) {
    return label + ':' + (error instanceof TypeError)
  }
}
const settings: Settings = { level: 1 }
freezeSettings(settings)
const unrelated = new Unrelated()
const results = [
  attempt('derived', () => {
    derived.extra = 5
  }),
  attempt('settings', () => {
    settings.level = 2
  }),
  attempt('unrelated', () => {
    unrelated.count = 3
  })
]
console.log(results.join(' '), derived.extra, settings.level, unrelated.count)

//! expect: derived:true settings:true unrelated:wrote 0 1 3
