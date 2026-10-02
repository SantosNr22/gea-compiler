// A spread copy is a snapshot, and the elision of a read-only one
// (`ir/spread-copy-elision.ts`) must stop wherever the snapshot can be told
// apart from its source: the source written after the copy, a call that may
// write it, the copy written or handed on, and a copy read after the cell was
// reassigned. Each function below keeps its real copy.
interface Options {
  limit?: number
  label?: string
}

function bump(options: Options): void {
  options.limit = (options.limit ?? 0) + 1
}

function sourceWritten(options: Options): string {
  const copy = { ...options }
  options.limit = 99
  return `${copy.limit ?? '-'}:${options.limit}`
}

function writtenByCall(options: Options): string {
  const copy = { ...options }
  bump(options)
  return `${copy.limit ?? '-'}:${options.limit ?? '-'}`
}

function copyWritten(options: Options): string {
  const copy = { ...options }
  copy.limit = 5
  return `${copy.limit}:${options.limit ?? '-'}`
}

function copyEscapes(options: Options): Options {
  options = { ...options }
  options.label = 'copied'
  return options
}

function copyReturnedUntouched(options: Options): Options {
  options = { ...options }
  return options
}

function reassigned(options: Options, other: Options): string {
  options = { ...options }
  const before = options.limit ?? '-'
  options = other
  return `${before}:${options.limit ?? '-'}`
}

function readAfterCall(options: Options): string {
  options = { ...options }
  bump(options)
  return `${options.limit ?? '-'}`
}

const source: Options = { limit: 1, label: 'a' }
console.log(sourceWritten({ limit: 1 }))
console.log(writtenByCall({ limit: 1 }))
console.log(copyWritten({ limit: 1 }))
const escaped = copyEscapes(source)
console.log(`${escaped.label}:${source.label}:${escaped === source}`)
console.log(copyReturnedUntouched(source) === source)
console.log(reassigned({ limit: 7 }, { limit: 8 }))
const target: Options = { limit: 10 }
console.log(readAfterCall(target))
console.log(target.limit)
//! expect: 1:99
//! expect: 1:2
//! expect: 5:1
//! expect: copied:a:false
//! expect: false
//! expect: 7:8
//! expect: 11
//! expect: 10
