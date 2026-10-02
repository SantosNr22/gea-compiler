//! expect: RangeError:out of range:ERR_OUT_OF_RANGE:true:true
//! expect: Error:not running:ERR_SERVER_NOT_RUNNING:same
//! expect: Error:boom:ENOENT:open:-2
//! expect: NodeNotImplementedError:fs.watch:ERR_GEA_NODE_NOT_IMPLEMENTED
// A program interface extending the intrinsic `Error` carries the error
// ITSELF, the shapes node-compat actually writes:
//
// - `new RangeError(m) as NodeArgumentError` (net.ts `outOfRange`): minted
//   by the RangeError constructor, so `name` and `instanceof RangeError` are
//   RangeError's while the interface adds `code`.
// - `(error as NodeArgumentError).code = ...` on an error the program did NOT
//   build as the interface (net.ts `Server.close`): the assertion re-types
//   the same object, so the write is seen through the original handle.
// - an interface extending another interface that extends `Error`, with
//   optional numeric and string members (`NodeJS.ErrnoException`).
// - required members written after the construction and a `name` override
//   (not-implemented.ts `nodeNotImplemented`), then caught as `unknown`.

interface NodeArgumentError extends Error {
  code: string
}

interface SystemError extends Error {
  code?: string
  syscall?: string
}

interface ErrnoException extends SystemError {
  errno?: number
}

interface NodeNotImplementedError extends Error {
  code: 'ERR_GEA_NODE_NOT_IMPLEMENTED'
  memberName: string
}

function outOfRange(): NodeArgumentError {
  const error = new RangeError('out of range') as NodeArgumentError
  error.code = 'ERR_OUT_OF_RANGE'
  return error
}

const ranged = outOfRange()
console.log(`${ranged.name}:${ranged.message}:${ranged.code}:${ranged instanceof RangeError}:${ranged instanceof Error}`)

const plain: Error = new Error('not running')
;(plain as NodeArgumentError).code = 'ERR_SERVER_NOT_RUNNING'
const retyped = plain as NodeArgumentError
console.log(`${plain.name}:${plain.message}:${retyped.code}:${retyped === plain ? 'same' : 'different'}`)

const errno = new Error('boom') as ErrnoException
errno.code = 'ENOENT'
errno.syscall = 'open'
errno.errno = -2
const report = (error: Error | null): void => {
  if (error === null) return
  const system = error as ErrnoException
  console.log(`${error.name}:${error.message}:${system.code}:${system.syscall}:${system.errno}`)
}
report(errno)

function notImplemented(member: string): never {
  const error = new Error(`${member} is not implemented`) as NodeNotImplementedError
  error.name = 'NodeNotImplementedError'
  error.code = 'ERR_GEA_NODE_NOT_IMPLEMENTED'
  error.memberName = member
  throw error
}

try {
  notImplemented('fs.watch')
} catch (thrown: unknown) {
  if (thrown instanceof Error) {
    const error = thrown as NodeNotImplementedError
    console.log(`${error.name}:${error.memberName}:${error.code}`)
  }
}
