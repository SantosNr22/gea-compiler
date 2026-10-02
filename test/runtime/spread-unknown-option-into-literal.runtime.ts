// AN `unknown` OPTION VALUE SPREAD AFTER A TYPED OPTION INTO ONE LITERAL.
//
// mongodb's `connection_string.ts` resolves `readConcern`/`writeConcern`
// options with `ReadConcern.fromOptions({ ...options.readConcern, ...value }
// as any)`, where `value` comes from `values: unknown[]` and was narrowed by
// `value instanceof ReadConcern || isRecord(value, ['level'])`. Object spread
// is CopyDataProperties: the later source's own enumerable keys overwrite the
// earlier ones, and keys the static type never mentioned are still copied.

class Concern {
  level: string
  constructor(level: string) {
    this.level = level
  }

  static fromOptions(options?: { concern?: Concern; level?: string; w?: number }): Concern | undefined {
    if (options == null) return undefined
    if (options.level) return new Concern(`${options.level}${options.w === undefined ? '' : `/w${options.w}`}`)
    return undefined
  }
}

interface Resolved {
  concern?: Concern
}

function isRecord<T extends readonly string[]>(value: unknown, requiredKeys: T): value is Record<T[number], any>
function isRecord(value: unknown, requiredKeys: readonly string[]): value is Record<string, any> {
  if (value === null || typeof value !== 'object') return false
  const keys = Object.keys(value as Record<string, any>)
  return requiredKeys.every((key) => keys.includes(key))
}

function transform(values: unknown[], options: Resolved): Concern | undefined {
  const [value] = values
  if (value instanceof Concern || isRecord(value, ['level'] as const)) {
    return Concern.fromOptions({ ...options.concern, ...value } as any)
  }
  throw new Error(`Concern must be an object, got ${JSON.stringify(value)}`)
}

const one = (value: unknown): unknown[] => {
  const values: unknown[] = []
  values.push(value)
  return values
}

//! expect: plain=majority
console.log(`plain=${transform(one({ level: 'majority' }), {})?.level}`)
// JavaScript prints `extra=[local/w2]`: `...value` copies `w` too. Here the
// guard's `Record<'level', any>` view is taken as the value's whole layout --
// the box is asserted into a one-field record and the spread copies that
// record's one field -- so `w` never reaches `fromOptions`.
//! known-wrong: extra=[local] -- a dynamic value narrowed to Record<'level', any> is copied as a closed one-field record
console.log(`extra=[${transform(one({ level: 'local', w: 2 }), { concern: new Concern('available') })?.level}]`)
//! expect: instance=linearizable
console.log(`instance=${transform(one(new Concern('linearizable')), {})?.level}`)
//! expect: refused=Concern must be an object, got 5
try {
  transform(one(5), {})
} catch (error) {
  console.log(`refused=${(error as Error).message}`)
}
