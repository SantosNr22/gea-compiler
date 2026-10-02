// A literal stored into a slot typed `Settings | Setting | undefined`
// (a record family, a class, and absence) is allocated as the record: the
// class is not something a literal can become, so the record is the only
// member that can hold it. Reads through either declared shape, a spread
// merge of two such literals, and the class arm itself all still answer.
'use strict'
interface Settings {
  w?: number | string
  wtimeout?: number
  j?: boolean
}
class Setting {
  constructor(
    public readonly w: number | string,
    public readonly j: boolean = false
  ) {}
  describe(): string {
    return `${this.w}/${this.j}`
  }
}
const fromOptions = (options: number | string | Settings | Setting | undefined, inherit?: Settings | Setting): Setting | undefined => {
  if (options == null) return undefined
  inherit = inherit ?? {}
  let opts: Settings | Setting | undefined
  if (typeof options === 'string' || typeof options === 'number') {
    opts = { w: options }
  } else if (options instanceof Setting) {
    opts = options
  } else {
    opts = options
  }
  const parent: Settings | Setting | undefined = inherit instanceof Setting ? inherit : inherit
  const merged = { ...parent, ...opts } as Settings
  const { w = undefined, wtimeout = undefined, j = undefined } = merged
  if (w != null || wtimeout != null || j != null) return new Setting(w ?? 1, j ?? false)
  return undefined
}
console.log(fromOptions('majority')?.describe(), fromOptions(2)?.describe(), fromOptions(undefined)?.describe())
console.log(
  fromOptions({ wtimeout: 5 })?.describe(),
  fromOptions({ j: true }, { w: 3 })?.describe(),
  fromOptions(new Setting(7, true))?.describe()
)
console.log(fromOptions({}, {})?.describe(), fromOptions(0, new Setting(9))?.describe())
//! expect: majority/false 2/false undefined
//! expect: 1/false 3/true 7/true
//! expect: undefined 0/false
export {}
