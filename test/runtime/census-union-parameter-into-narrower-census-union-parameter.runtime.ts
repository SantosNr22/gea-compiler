// A census-built union parameter handed on to another function's
// census-built union parameter that holds FEWER arms: mongodb's
// `resolveOptions(parent: OperationParent)` -- MongoClient | Db | Collection
// | ... -- calling `resolveBSONOptions(options, parent?: { bsonOptions? })`,
// whose own callers passed only a Db or a MongoClient. Every arm of the
// source must reach the call, the Collection included.

interface BsonOptions {
  raw?: boolean
  promoteLongs?: boolean
}

class Client {
  s: { bsonOptions: BsonOptions } = { bsonOptions: { raw: false, promoteLongs: true } }
  get bsonOptions(): BsonOptions {
    return this.s.bsonOptions
  }
}

class Db {
  s: { bsonOptions: BsonOptions }
  constructor(client: Client) {
    this.s = { bsonOptions: resolveBSONOptions({ raw: true }, client) }
  }
  get bsonOptions(): BsonOptions {
    return this.s.bsonOptions
  }
}

class Collection {
  s: { bsonOptions: BsonOptions }
  constructor(db: Db) {
    this.s = { bsonOptions: resolveBSONOptions({}, db) }
  }
  get bsonOptions(): BsonOptions {
    return this.s.bsonOptions
  }
}

interface OperationParent {
  bsonOptions?: BsonOptions
  timeoutMS?: number
}

function resolveBSONOptions(options?: BsonOptions, parent?: { bsonOptions?: BsonOptions }): BsonOptions {
  const parentOptions = parent?.bsonOptions
  return {
    raw: options?.raw ?? parentOptions?.raw ?? false,
    promoteLongs: options?.promoteLongs ?? parentOptions?.promoteLongs ?? true
  }
}

function resolveOptions(parent: OperationParent | undefined, options?: BsonOptions): BsonOptions {
  return resolveBSONOptions(options, parent)
}

const client = new Client()
const db = new Db(client)
const collection = new Collection(db)
const show = (options: BsonOptions): string => `raw=${String(options.raw)} promoteLongs=${String(options.promoteLongs)}`
//! expect: collection raw=true promoteLongs=true
console.log(`collection ${show(resolveOptions(collection))}`)
//! expect: db raw=true promoteLongs=false
console.log(`db ${show(resolveOptions(db, { promoteLongs: false }))}`)
//! expect: client raw=false promoteLongs=true
console.log(`client ${show(resolveOptions(client))}`)
//! expect: record raw=true promoteLongs=true
console.log(`record ${show(resolveOptions({ bsonOptions: { raw: true } }))}`)
