// mongodb's `AutoEncrypter` takes `schemaMap?: Document` and serializes it
// unless `Buffer.isBuffer(options.schemaMap)` says it already is BSON bytes.
// A Document can be a Buffer only if it views one, so the narrowed arm reads
// the object the Document views and refuses anything else; a Document that
// holds its own entries never passes the guard and takes the other arm.
interface BsonDocument {
  [key: string]: any
}

function isBytes(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array
}

function encode(document: BsonDocument): Uint8Array {
  return new Uint8Array(Object.keys(document).length)
}

function schemaBytes(schemaMap?: BsonDocument): Uint8Array {
  return isBytes(schemaMap) ? schemaMap : encode(schemaMap ?? {})
}

console.log(schemaBytes({ a: 1, b: 2 }).length, schemaBytes().length)
//! expect: 2 0
//! emitted-has: gea::dictionary::aliasedObject(
