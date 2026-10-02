// A class extending `Error`, stored where the slot is typed `Error`: the
// MongoDB driver returns its `MongoError` subclasses from functions declared
// `: Error` and passes them as an options bag's `cause`. The instance IS an
// Error -- the store is an upcast, and the subclass's identity, message and
// own fields survive it.
class MongoError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.name = 'MongoError'
    this.code = code
  }
}

class MongoNetworkError extends MongoError {
  constructor(message: string) {
    super(message, 6)
    this.name = 'MongoNetworkError'
  }
}

function classify(error: Error): Error {
  if (!(error instanceof MongoError)) return error
  return error.code > 5 ? new MongoError(`wrapped ${error.message}`, 1) : error
}

interface Options {
  cause?: Error
}

const plain = new Error('boom')
const network = new MongoNetworkError('socket closed')
const options: Options = { cause: network }
const classified = classify(network)
console.log(classify(plain) === plain, classified.message, classified instanceof MongoError, classified.name)
console.log(options.cause === network, options.cause instanceof MongoNetworkError, options.cause?.message)
//! expect: true wrapped socket closed true MongoError
//! expect: true true socket closed
