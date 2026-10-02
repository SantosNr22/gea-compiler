// Object.entries / Object.values over a typed dictionary walk the table's own
// storage in creation order; integer-like keys still hoist ahead (10.1.11) and
// non-enumerable keys stay out.

function plain(): string {
  const table: Record<string, number> = {}
  table.b = 1
  table.a = 2
  table.c = 3
  return (
    Object.entries(table)
      .map(([k, v]) => `${k}:${v}`)
      .join(',') +
    '|' +
    Object.values(table).join(',')
  )
}
//! expect: plain=b:1,a:2,c:3|1,2,3
console.log(`plain=${plain()}`)

function hoisted(): string {
  const table: Record<string, number> = {}
  table.b = 1
  table['2'] = 2
  table.a = 3
  table['1'] = 4
  return (
    Object.entries(table)
      .map(([k, v]) => `${k}:${v}`)
      .join(',') +
    '|' +
    Object.values(table).join(',')
  )
}
//! expect: hoisted=1:4,2:2,b:1,a:3|4,2,1,3
console.log(`hoisted=${hoisted()}`)

function hidden(): string {
  const table: Record<string, number> = {}
  table.x = 1
  table.y = 2
  Object.defineProperty(table, 'x', { value: 1, enumerable: false })
  return (
    Object.entries(table)
      .map(([k, v]) => `${k}:${v}`)
      .join(',') +
    '|' +
    Object.values(table).join(',')
  )
}
//! expect: hidden=y:2|2
console.log(`hidden=${hidden()}`)
