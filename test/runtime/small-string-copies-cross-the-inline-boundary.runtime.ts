//! expect: keys=,a,bb,ccc,dddddddddddddd,eeeeeeeeeeeeeee,ffffffffffffffff,gggggggggggggggggggggggggggggggggggggggg
//! expect: copies-equal=true
//! expect: edited-source=aXb
//! expect: edited-copy=a
//! expect: union=bb|15|ffffffffffffffff
//! expect: optional=bb|eeeeeeeeeeeeeee|ffffffffffffffff|none
//! expect: assigned=ccc>dddddddddddddd>gggggggggggggggggggggggggggggggggggggggg>a
// A string of up to 15 bytes lives inside the std::string object, and the runtime copies such a string as raw
// bytes instead of through memcpy (`detail::duplicateString`). The raw copy must keep the copy's pointer on its
// OWN buffer: an edited source, an edited copy, and a copy that outgrows the buffer must each leave the other alone.
// Lengths 0, 1, 2, 3, 14, 15, 16 and 40 straddle the 15-byte inline limit.
const names = ['', 'a', 'bb', 'ccc', 'd'.repeat(14), 'e'.repeat(15), 'f'.repeat(16), 'g'.repeat(40)]

const at = (index: number): string => names[index] ?? ''

const table: Record<string, number> = {}
for (const name of names) table[name] = name.length
console.log('keys=' + Object.keys(table).join(','))

const copy: Record<string, number> = { ...table }
let same = true
for (const name of names) if (copy[name] !== table[name]) same = false
console.log('copies-equal=' + same)

let source = 'a'
const held: { text: string } = { text: source }
const duplicate = { ...held }
source = source + 'Xb'
held.text = held.text.replace('a', 'aXb')
console.log('edited-source=' + held.text)
console.log('edited-copy=' + duplicate.text)

const pick = (index: number): string | number => (index % 2 === 0 ? at(index) : at(index).length)
const unioned: Array<string | number> = [pick(2), pick(5), pick(6)]
const unionCopy = unioned.slice()
console.log('union=' + unionCopy.join('|'))

const maybe = (index: number): string | undefined => (index < names.length ? at(index) : undefined)
const present: Array<string | undefined> = [maybe(2), maybe(5), maybe(6), maybe(99)]
const presentCopy = present.slice()
console.log('optional=' + presentCopy.map((value) => (value === undefined ? 'none' : value)).join('|'))

let current: string | undefined = at(3)
const trail: string[] = [current ?? '']
current = at(4)
trail.push(current)
current = at(7)
trail.push(current)
current = at(1)
trail.push(current)
console.log('assigned=' + trail.join('>'))
