//! expect: This socket has been ended by the other party:EPIPE:true
// AN `interface extends Error` VALUE HANDED TO AN `(err?: Error | null)` CALLBACK.
//
// node-compat's `net.Socket.write` builds its EPIPE error as
// `new Error(...) as NodeArgumentError` (an interface extending `Error` with a
// `code`) and hands it to the write callback, whose formal is
// `Error | null | undefined`. The error must arrive as itself: its message,
// its `code`, and `instanceof Error` -- node prints
// `This socket has been ended by the other party:EPIPE:true`.
//
// An interface whose heritage reaches the intrinsic `Error` carries the error
// itself (`gea::runtime::Error`), exactly as `Error & { code: string }` does:
// nothing constructs an interface, so its values are errors the program
// re-typed, and `code` lives in the native error's dynamic-property sidecar.
// The store into the `Error` arm is then the same carrier, not a conversion.
//
// It used to mint the interface's own generated record
// (`ErrorConstructor::create<gea_record_type_N>`), a struct that copied
// `Error`'s fields without deriving from `gea::runtime::Error`, so no pointer
// upcast reached the sum's `Error` arm and a field-by-field rebuild would
// have been a different object (a later `error.code = ...` through either
// handle would not be seen by the other). Before 2026-09-23 it compiled and
// printed `undefined`: the record view counted the sum's `undefined` arm as a
// home (the chain's `unreachable-value` step answers record -> `undefined` by
// DISCARDING the value), it was the only home, and the callback received
// `undefined` in place of the error. It was then pinned as a refusal until the
// carrier changed.

interface CodedError extends Error {
  code?: string
}

type WriteCallback = (error?: Error | null) => void

function fail(callback: WriteCallback): void {
  const error = new Error('This socket has been ended by the other party') as CodedError
  error.code = 'EPIPE'
  callback(error)
}

fail((error) => {
  if (error === undefined) console.log('undefined')
  else if (error === null) console.log('null')
  else console.log(`${error.message}:${(error as CodedError).code}:${error instanceof Error}`)
})
