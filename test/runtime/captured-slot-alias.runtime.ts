// Reads of an immutable captured string/array/object alias the environment
// slot rather than copying it; the slot must survive repeated calls, a dying
// last use, and a closure that drops its own owner mid-call.
class Box {
  label: string
  constructor(label: string) {
    this.label = label
  }
}

const makeReader = (name: string, items: number[], box: Box) => {
  const read = (): string => name + ':' + items.length + ':' + box.label
  const take = (): string[] => {
    const out: string[] = []
    out.push(name)
    return out
  }
  return { read, take }
}

let holder: { run: (() => string) | null } = { run: null }
const selfDropping = (tag: string) => {
  holder.run = () => {
    holder.run = null
    return tag + tag.length
  }
}

const r = makeReader('alpha', [1, 2, 3], new Box('b'))
console.log(r.read(), r.read(), r.take()[0], r.take()[0], r.read())
selfDropping('omega')
const run = holder.run
console.log(run === null ? 'none' : run(), holder.run === null)

//! expect: alpha:3:b alpha:3:b alpha alpha alpha:3:b
//! expect: omega5 true
