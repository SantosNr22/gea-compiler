// `Object.defineProperty` with `get`/`set` installs an ACCESSOR property
// (ECMA-262 10.1.6.3): unstated attributes default to false, so it is
// neither enumerable nor configurable, `Object.keys` skips it, and
// `Object.getOwnPropertyDescriptor` reports `{ get, set, enumerable,
// configurable }` with no `value`. The getter runs on every read with `this`
// bound to the object read from -- for a plain object held as `any` and for a
// class instance, whose undeclared key lives in its dynamic-property sidecar
// while its declared fields stay native.
let reads = 0
const plain: any = { base: 10 }
Object.defineProperty(plain, 'twice', {
  get() {
    reads++
    return this.base * 2
  },
  set(value: number) {
    this.base = value / 2
  }
})
console.log(plain.twice, reads, Object.keys(plain).join(','))
//! expect: 20 1 base
plain.twice = 50
console.log(plain.base, plain.twice, reads)
//! expect: 25 50 2

const plainDescriptor = Object.getOwnPropertyDescriptor(plain, 'twice')
console.log(typeof plainDescriptor?.get, typeof plainDescriptor?.set, plainDescriptor?.enumerable, plainDescriptor?.configurable)
//! expect: function function false false
console.log('value' in (plainDescriptor as object), 'writable' in (plainDescriptor as object))
//! expect: false false

Object.defineProperty(plain, 'shown', { get: () => 'visible', enumerable: true, configurable: true })
console.log(Object.keys(plain).join(','), JSON.stringify(Object.values(plain)), JSON.stringify(plain))
//! expect: base,shown [25,"visible"] {"base":25,"shown":"visible"}

class Counter {
  count = 3
  bump(): void {
    this.count++
  }
}

const counter = new Counter()
Object.defineProperty(counter, 'doubled', {
  get() {
    reads++
    return this.count * 2
  },
  enumerable: false
})
counter.bump()
console.log((counter as any).doubled, counter.count, reads, Object.keys(counter).join(','))
//! expect: 8 4 3 count

const classDescriptor = Object.getOwnPropertyDescriptor(counter, 'doubled')
console.log(typeof classDescriptor?.get, classDescriptor?.set, classDescriptor?.enumerable, classDescriptor?.configurable)
//! expect: function undefined false false
