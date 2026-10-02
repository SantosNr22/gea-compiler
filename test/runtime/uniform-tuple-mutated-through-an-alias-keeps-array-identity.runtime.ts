// Mutation is the identity condition a by-value tuple carrier must never
// observe wrongly: `const alias = list[0]; alias[1] = 99` expects
// `list[0][1]` to read 99 back, exactly as it would for a real Array, because
// `alias` and `list[0]` are ONE object. A record's write disqualifies its
// tuple id the same way it disqualifies an object's (`value-records.ts`), so
// this tuple keeps today's `array-object` carrier and the alias keeps working.
type Pair5 = [number, number, number, number, number]

const list: Pair5[] = []
list.push([1, 2, 3, 4, 5])
const alias = list[0]!
alias[1] = 99

console.log('via-original=' + list[0]![1])
console.log('via-alias=' + alias[1])

//! expect: via-original=99
//! expect: via-alias=99
