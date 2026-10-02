// The MongoDB driver names its errors with constant getters rather than by
// assigning `this.name`: `override get name(): string { return 'MongoError' }`
// on the root and again on every subclass. Held where the slot is typed
// `Error`, the instance is read through the intrinsic Error layout, so the
// name that layout stores must be the most-derived getter's answer.
class MongoError extends Error {
  constructor(message: string) {
    super(message)
  }
  override get name(): string {
    return 'MongoError'
  }
}

class MongoNetworkError extends MongoError {
  override get name(): string {
    return 'MongoNetworkError'
  }
}

class MongoNetworkTimeoutError extends MongoNetworkError {}

function describe(error: Error): string {
  return `${error.name}:${error.message}`
}

const errors: Error[] = [new MongoError('a'), new MongoNetworkError('b'), new MongoNetworkTimeoutError('c'), new Error('d')]
console.log(errors.map(describe).join(' '))
const timeout = new MongoNetworkTimeoutError('e')
console.log(timeout.name, String(timeout), timeout instanceof MongoNetworkError)
//! expect: MongoError:a MongoNetworkError:b MongoNetworkError:c Error:d
//! expect: MongoNetworkError MongoNetworkError: e true
