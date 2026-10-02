// `x.constructor.name` over `CompiledError | Error` (mongodb's `errorStrictEqual`
// in utils.ts): the constructor a value's prototype chain names, per
// ECMA-262 -- the class's own name for a compiled subclass (and its
// subclasses), the intrinsic constructor's name for a native error.

class MongoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MongoError'
  }
}
class MongoNetworkError extends MongoError {}
class MongoServerError extends MongoError {
  code = 11000
}

type AnyError = MongoError | Error

function constructorNameOf(error: AnyError): string {
  return error.constructor.name
}

// A bare `Error` slot can hold a compiled subclass too: the name is still the allocating class's.
function plainConstructorNameOf(error: Error): string {
  return error.constructor.name
}

function errorStrictEqual(lhs?: AnyError | null, rhs?: AnyError | null): boolean {
  if (lhs === rhs) return true
  if (!lhs || !rhs) return lhs === rhs
  if (lhs.constructor.name !== rhs.constructor.name) return false
  return lhs.message === rhs.message
}

const errors: AnyError[] = [
  new MongoError('a'),
  new MongoNetworkError('b'),
  new MongoServerError('c'),
  new Error('d'),
  new TypeError('e'),
  new RangeError('f')
]
console.log(errors.map(constructorNameOf).join(' '))
console.log([new MongoServerError('p'), new SyntaxError('q'), new Error('r')].map(plainConstructorNameOf).join(' '))
console.log(
  errorStrictEqual(new MongoError('x'), new MongoError('x')),
  errorStrictEqual(new MongoError('x'), new MongoNetworkError('x')),
  errorStrictEqual(new MongoError('x'), new Error('x')),
  errorStrictEqual(new TypeError('x'), new TypeError('x')),
  errorStrictEqual(new TypeError('x'), new RangeError('x')),
  errorStrictEqual(null, undefined),
  errorStrictEqual(new MongoServerError('x'), new MongoServerError('y'))
)

//! expect: MongoError MongoNetworkError MongoServerError Error TypeError RangeError
//! expect: MongoServerError SyntaxError Error
//! expect: true false false true false false false
