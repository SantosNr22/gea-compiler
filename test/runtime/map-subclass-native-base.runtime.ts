// A class extending the native Map: its instance IS the runtime collection,
// the Map's own members answer natively, an override reaches the native
// member through `super`, and `super(entries)` seeds the base.
class Levels extends Map<string, number> {
  constructor(entries: [string, number][]) {
    const doubled: [string, number][] = []
    for (const [name, level] of entries) doubled.push([name.toUpperCase(), level])
    doubled.push(...entries)
    super(doubled)
  }
  levelOf(name: string): number {
    return this.get(name) ?? -1
  }
}

class CaseInsensitive<V> extends Map<string, V> {
  constructor(entries: Array<[string, V]> = []) {
    super(entries.map(([k, v]): [string, V] => [k.toLowerCase(), v]))
  }
  override get(k: string) {
    return super.get(k.toLowerCase())
  }
  override set(k: string, v: V) {
    return super.set(k.toLowerCase(), v)
  }
  override has(k: string) {
    return super.has(k.toLowerCase())
  }
}

const levels = new Levels([['a', 1], ['b', 2]])
console.log(levels.size, levels.levelOf('A'), levels.levelOf('b'), levels.levelOf('z'))

const options = new CaseInsensitive<number[]>([['Hosts', [1, 2]]])
options.set('ReplicaSet', [3])
console.log(options.size, options.has('HOSTS'), options.get('replicaset')?.length, options.get('nope') === undefined)

let total = 0
for (const [, level] of levels) total += level
console.log(total)

const countOf = (map: Map<string, number>): number => map.size
console.log(countOf(levels))
//! expect: 4 1 2 -1
//! expect: 2 true 1 true
//! expect: 6
//! expect: 4
