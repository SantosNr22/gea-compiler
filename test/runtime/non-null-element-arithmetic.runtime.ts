// Under `noUncheckedIndexedAccess` an element read is `number | undefined` and
// `!` only erases that at the type level: the carrier stays absent-capable, so
// arithmetic between two such reads must convert both sides (absence is
// `undefined`, ToNumber is NaN), exactly as a single one beside a `number` does.
const wide = new Uint32Array([4294967295, 7])
const signed = new Int8Array([-128, 127])
const bytes = new Uint8Array([200, 100, 3])
const list: number[] = [1.5, 2.25]

const sumWide = (view: Uint32Array): number => view[0]! + view[1]!
const spanSigned = (view: Int8Array): number => view[0]! - view[1]!
const productBytes = (view: Uint8Array): number => view[0]! * view[1]! * view[2]!
const ordered = (view: Uint8Array): boolean => view[1]! < view[0]!
const packed = (view: Uint8Array): number => view[0]! | (view[1]! << 8)
const sumList = (values: number[]): number => values[0]! + values[1]!
const beyond = (view: Uint8Array): number => view[0]! + view[7]!

console.log(sumWide(wide), spanSigned(signed), productBytes(bytes), ordered(bytes), packed(bytes), sumList(list), beyond(bytes))

//! expect: 4294967302 -255 60000 true 25800 3.75 NaN
