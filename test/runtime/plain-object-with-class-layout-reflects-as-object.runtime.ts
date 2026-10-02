// An object literal laid out as a data-only class is an ordinary object, not
// an instance -- through a box as much as through the static carrier. Only a
// real instance answers as the class, and both enumerate only what they own.
class Options {
  limit?: number
  label?: string
}
const literal: Options = { limit: 3 }
const instance = new Options()
instance.limit = 4
const probe = (value: any): string => `${value instanceof Options} ${value.limit} ${Object.keys(value).join(',')}`
console.log(probe(literal))
console.log(probe(instance))
console.log(literal instanceof Options, instance instanceof Options)

//! expect: false 3 limit
//! expect: true 4 limit
//! expect: false true
