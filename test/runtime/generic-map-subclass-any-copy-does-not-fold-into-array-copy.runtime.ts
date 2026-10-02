//! expect: rs0 100 0
//! expect: replicaset rs0
//! expect: maxpoolsize 100
// A `Map` subclass instantiated only at its `any` default and at `unknown[]`.
// The `any` copy may fold onto another copy only where its filling never
// reaches mutable storage; here it IS the map's value slot, so folding the
// `any` copy onto the `unknown[]` one gave `new CaseInsensitiveMap([['ReplicaSet',
// 'rs0']])` a `gea::Map<std::string, Ref<Array<Value>>>` base, and storing
// `'rs0'` into it failed in clang at `makeMapEntry`.
//
// node prints:
//   rs0 100 0
//   replicaset rs0
//   maxpoolsize 100
class CaseInsensitiveMap<Value = any> extends Map<string, Value> {
  constructor(entries: Array<[string, any]> = []) {
    super(entries.map(([k, v]) => [k.toLowerCase(), v]))
  }
  override get(k: string): Value | undefined {
    return super.get(k.toLowerCase())
  }
  override set(k: string, v: any) {
    return super.set(k.toLowerCase(), v)
  }
}

const DEFAULTS = new CaseInsensitiveMap([
  ['ReplicaSet', 'rs0'],
  ['MaxPoolSize', 100]
])
const counts = new CaseInsensitiveMap<unknown[]>()
const pool: unknown[] = []
counts.set('PoolSize', pool)
console.log(DEFAULTS.get('REPLICASET'), DEFAULTS.get('maxPoolSize'), counts.get('POOLSIZE')?.length)
for (const [key, value] of DEFAULTS.entries()) console.log(key, value)
