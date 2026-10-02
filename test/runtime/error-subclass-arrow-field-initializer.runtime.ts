//! expect: from-field
//! expect: x

// A class that extends the intrinsic Error and declares no constructor runs
// its field initializers after the implicit `super(...args)` returns, exactly
// as one that writes the constructor out.

class ResponseError extends Error {
  getResponse = (): string => 'from-field'
}

const error = new ResponseError('x')
console.log(error.getResponse())
console.log(error.message)
