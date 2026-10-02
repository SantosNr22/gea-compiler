// Reads of a cell the program defines a class or function into exactly once
// name the cell instead of copying it; constructing and calling through such
// reads repeatedly, and handing them out as values, must see the one definition.
class Failure extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

function describe(value: number): string {
  return 'v' + value
}

const makeFailure = (index: number): Failure => new Failure('f' + index, index)

const handlers: ((value: number) => string)[] = []
for (let index = 0; index < 3; index += 1) handlers.push(describe)

const failures: Failure[] = []
for (let index = 0; index < 3; index += 1) failures.push(makeFailure(index))

console.log(failures.map((failure) => failure.message + failure.code).join(','), handlers.map((handler, index) => handler(index)).join(','))
console.log(failures[2] instanceof Failure, handlers[0] === describe)

//! expect: f00,f11,f22 v0,v1,v2
//! expect: true true
