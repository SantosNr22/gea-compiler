// A record nothing in the program can freeze, seal or redefine keeps its three
// attribute bits as one `static` triple per field (records.ts's
// `attributesConstant`, from integrity-restrictions.ts's
// `restrictsRecordShape`) instead of a byte per field per instance, while a
// record the program DOES freeze keeps them per instance. Both must still
// answer every reflective question exactly as node does: descriptors, own
// keys, spread, entries, JSON, delete, and a rejected write.
type Plain = { plainFirst: number; plainSecond?: string; plainThird?: boolean }
type Locked = { lockedFirst: number; lockedSecond?: number }

//! emitted-has: static inline gea::NativeIndexAttributes gea_attributes_plainFirst;
//! emitted-has: static inline gea::NativeIndexAttributes gea_attributes_plainThird;
//! emitted-has:   gea::NativeIndexAttributes gea_attributes_lockedFirst;
//! emitted-lacks: static inline gea::NativeIndexAttributes gea_attributes_lockedFirst;

const plain: Plain = { plainFirst: 1, plainSecond: 'two' }
const locked: Locked = { lockedFirst: 1, lockedSecond: 2 }
const other: Locked = { lockedFirst: 7 }
Object.freeze(locked)

const flags = (target: object, key: string): string => {
  const descriptor = Object.getOwnPropertyDescriptor(target, key)
  return descriptor === undefined ? 'absent' : [descriptor.writable, descriptor.enumerable, descriptor.configurable].join('/')
}

console.log(flags(plain, 'plainFirst'), flags(plain, 'plainSecond'), flags(plain, 'plainThird'))
//! expect: true/true/true true/true/true absent

console.log(flags(locked, 'lockedFirst'), flags(locked, 'lockedSecond'), flags(other, 'lockedFirst'))
//! expect: false/true/false false/true/false true/true/true

console.log(Object.isFrozen(plain), Object.isFrozen(locked), Object.isFrozen(other), Object.isExtensible(plain))
//! expect: false true false true

plain.plainFirst = 5
plain.plainThird = true
console.log(Object.keys(plain).join(','), JSON.stringify(plain))
//! expect: plainFirst,plainSecond,plainThird {"plainFirst":5,"plainSecond":"two","plainThird":true}

const copy = { ...plain }
console.log(JSON.stringify(copy), Object.entries(plain).length)
//! expect: {"plainFirst":5,"plainSecond":"two","plainThird":true} 3

delete plain.plainSecond
console.log(Object.keys(plain).join(','), flags(plain, 'plainSecond'), 'plainSecond' in plain)
//! expect: plainFirst,plainThird absent false

plain.plainSecond = 'again'
console.log(Object.keys(plain).join(','), flags(plain, 'plainSecond'))
//! expect: plainFirst,plainThird,plainSecond true/true/true

const rejected = (write: () => void): string => {
  try {
    write()
    return 'written'
  } catch (error) {
    return (error as Error).name
  }
}
console.log(
  rejected(() => {
    locked.lockedFirst = 9
  }),
  rejected(() => {
    other.lockedFirst = 9
  }),
  locked.lockedFirst,
  other.lockedFirst
)
//! expect: TypeError written 1 9
