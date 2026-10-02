//! expect: document:false
//! expect: none

// mongodb's `throwIfWriteConcernError(response: unknown)`: a reply that is
// not a `MongoDBResponse` is tested with `'writeConcernError' in response`,
// and the conditional `cond ? response : null` is stored as `object | null`.
// The only instance flowing in is a class, so `response` is carried as that
// class and the `null` arm as its empty handle -- which must stay `null` in
// the `object | null` slot rather than become an object with nothing in it.

class MongoDBResponse {
  static is(value: unknown): value is MongoDBResponse {
    return value instanceof MongoDBResponse
  }
  has(name: string): boolean {
    return name === 'ok'
  }
  toObject(): Record<string, unknown> {
    return { ok: 1 }
  }
}

function writeConcernErrorOf(response: unknown): object | null {
  if (typeof response === 'object' && response != null) {
    const writeConcernError: object | null =
      MongoDBResponse.is(response) && response.has('writeConcernError')
        ? response.toObject()
        : !MongoDBResponse.is(response) && 'writeConcernError' in response
          ? response
          : null
    return writeConcernError
  }
  return null
}

console.log('document:' + String(writeConcernErrorOf(new MongoDBResponse()) != null))
const none = writeConcernErrorOf(new MongoDBResponse())
console.log(none === null ? 'none' : 'object')
