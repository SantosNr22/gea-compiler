//! expect: 3
//! expect: {"tasks":3}
//! expect: nested kept
//! expect: {"first":{"value":"kept"}}
const dictionary = JSON.parse('{"tasks":3}') as Record<string, number>
console.log(dictionary['tasks'])
console.log(JSON.stringify(dictionary))
const nested = JSON.parse('{"first":{"value":"kept"}}') as Record<string, { value: string }>
console.log('nested', nested['first']!.value)

console.log(JSON.stringify(nested))
