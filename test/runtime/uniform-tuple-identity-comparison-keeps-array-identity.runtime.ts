// `===` on two tuple values asks which object, not which value: a by-value
// struct copy would answer this by comparing fields, which is wrong the
// moment two DISTINCT, equal-by-value tuples exist. An identity test
// disqualifies the tuple id it names (`value-records.ts`'s `identityTest`
// branch), so this tuple stays an `array-object` and `===` keeps comparing
// pointers.
type Pair5 = [number, number, number, number, number]

const list: Pair5[] = []
list.push([1, 2, 3, 4, 5])
list.push([1, 2, 3, 4, 5])

console.log('same-object=' + (list[0] === list[0]))
console.log('distinct-value-equal=' + (list[0] === list[1]))

//! expect: same-object=true
//! expect: distinct-value-equal=false
