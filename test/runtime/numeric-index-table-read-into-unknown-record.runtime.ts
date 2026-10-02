// A `{ [key: number]: any }` table READ OFF a typed result and placed into a
// fresh object literal handed to an `unknown` parameter.

interface InsertManyResult {
  acknowledged: boolean
  insertedIds: { [key: number]: any }
}

function insertMany(names: string[]): InsertManyResult {
  const ids: { [index: number]: any } = {}
  names.forEach((name, index) => {
    ids[index] = name
  })
  return { acknowledged: true, insertedIds: ids }
}

function show(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${key}:${show(record[key])}`)
      .join(',')}}`
  }
  return typeof value
}

const many = insertMany(['a', 'b'])
//! expect: {acknowledged:true,insertedIds:{0:"a",1:"b"}}
console.log(show({ acknowledged: many.acknowledged, insertedIds: many.insertedIds }))
