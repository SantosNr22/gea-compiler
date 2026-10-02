// A spread whose source still holds only a literal's key table (no log built)
// ranks each present field by its place in that table, and a receiver that is
// itself a pended prefix keeps the places of the keys it already holds when the
// source repeats them. Both are looked up by position (a rank table and a
// bitset), so this pins the orders they answer: the source's literal order, not
// the layout's, and a repeated key keeping its first place with the source's value.
interface Options {
  a?: number
  b?: number
  c?: string
  d?: number
  e?: boolean
  f?: number
}

function main(): void {
  const base: Options = { c: 'x', a: 1 }
  const withPrefix: Options = { e: true, ...base }
  console.log(Object.keys(withPrefix).join())

  const chained: Options = { d: 4, ...withPrefix, b: 2 }
  console.log(Object.keys(chained).join())

  const repeated: Options = { a: 0, d: 9, ...base }
  console.log(Object.keys(repeated).join(), repeated.a, repeated.d, repeated.c)

  const wide: Options = { f: 6, b: 5, d: 4, a: 3 }
  const copy: Options = { ...wide }
  const both: Options = { c: 'y', ...wide, ...base }
  console.log(Object.keys(copy).join(), Object.keys(both).join(), both.a, both.c)
}
main()
//! expect: e,c,a
//! expect: d,e,c,a,b
//! expect: a,d,c 1 9 x
//! expect: f,b,d,a c,f,b,d,a 1 x
