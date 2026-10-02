// An object literal built somewhere other than the constructor that takes it
// -- `const options = { ...cursorOptions, session }` then `new
// FindOperation(options)`, or a generic `resolveOptions({ ... })` whose result
// IS the literal's type -- is laid out in the interface family's one layout
// when it flows into one of the family's views. The operation holds the very
// object the caller built, so a later write through either is seen through
// the other, and the operations' redeclared `options` slot holds one record
// rather than a union of every literal handed to it.
interface BaseOptions {
  session?: string
  raw?: boolean
}
interface FindOptions extends BaseOptions {
  limit?: number
}
interface CommandOptions extends BaseOptions {
  comment?: string
}

class Operation {
  options: BaseOptions
  constructor(options: BaseOptions) {
    this.options = options
  }
  session(): string {
    return this.options.session ?? '-'
  }
}
class FindOperation extends Operation {
  override options: FindOptions
  constructor(options: FindOptions) {
    super(options)
    this.options = options
  }
}
class CommandOperation extends Operation {
  override options: CommandOptions
  constructor(options: CommandOptions) {
    super(options)
    this.options = options
  }
}

function resolveOptions<T extends BaseOptions>(options: T): T {
  const result: T = Object.assign({}, options)
  return result
}

const cursorOptions: FindOptions = { limit: 3 }
const options = { ...cursorOptions, session: 's' }
const find = new FindOperation(options)
options.raw = true
console.log(find.options === options, find.options.raw, find.options.limit, find.options.session)
const resolved = resolveOptions({ comment: 'c', raw: false })
const command = new CommandOperation(resolved)
command.options.session = 't'
const seen: CommandOptions = resolved
console.log(command.options === resolved, command.options.comment, seen.session)
// A member seen through `Omit` under the program's own alias is a view of
// the same layout too.
type RemoveOptions = Omit<CommandOptions, 'comment'>
class RemoveOperation extends CommandOperation {
  constructor(options: RemoveOptions) {
    super(options)
  }
}
function removeWith(options?: RemoveOptions): RemoveOperation {
  return new RemoveOperation({ session: 'r', ...options })
}
const removeOptions: RemoveOptions = { raw: true }
const remove = new RemoveOperation(removeOptions)
removeOptions.session = 'u'
console.log(remove.options === removeOptions, remove.session(), removeWith({ raw: false }).session())
const operations: Operation[] = [find, command, remove]
console.log(operations.map((operation) => operation.session()).join(','))
//! expect: true true 3 s
//! expect: true c t
//! expect: true u r
//! expect: s,t,u
export {}
