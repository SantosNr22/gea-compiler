//! expect: nullable true kept
//! expect: dictionary 3
//! expect: duplicate true
//! expect: date 0
//! expect: absent-date true

interface Payload {
  missing: string | null
  present: string | null
  counts: Record<string, number>
}
const payload = JSON.parse('{"missing":null,"present":"kept","counts":{"tasks":3}}') as Payload
console.log('nullable', payload.missing === null, payload.present)
console.log('dictionary', payload.counts['tasks'])
const duplicate = JSON.parse('{"missing":"first","missing":null,"present":"kept","counts":{}}') as Payload
console.log('duplicate', duplicate.missing === null)

function parseDate(value: string | undefined): number {
  return Date.parse(value!)
}
console.log('date', parseDate('1970-01-01T00:00:00.000Z'))
console.log('absent-date', Number.isNaN(parseDate(undefined)))
