// sparse-bitfield's `this.pages = opts.pages || pager(this.pageSize)`: every
// caller passes `{ buffer }`, so `opts.pages` is an absent key -- `undefined`
// -- and the field is provably the Pager instance the right arm constructs.
// `if (!opts) opts = {}` reassigns the parameter to an empty literal, whose
// `pages` read is just as absent. sparse-bitfield also accepts a bare buffer
// (`Buffer.isBuffer(opts)`); `Array.isArray` is the same narrowing of an
// unannotated parameter, false of every record its callers pass.
function Pager(pageSize) {
  if (!(this instanceof Pager)) return new Pager(pageSize)
  this.length = 0
  this.pageSize = pageSize || 1024
}

Pager.prototype.grow = function () {
  this.length++
}

function Bitfield(opts) {
  if (!(this instanceof Bitfield)) return new Bitfield(opts)
  if (!opts) opts = {}
  if (Array.isArray(opts)) opts = { buffer: opts }

  this.pageOffset = opts.pageOffset || 0
  this.pageSize = opts.pageSize || 1024
  this.pages = opts.pages || Pager(this.pageSize)
  this.pages.grow()

  this.byteLength = this.pages.length * this.pageSize
  this.length = 8 * this.byteLength
  if (opts.buffer) this.byteLength = opts.buffer.length
}

Bitfield.prototype.pageCount = function () {
  return this.pages.length
}

var table = Bitfield({ buffer: [1, 2, 3] })
console.log(table.byteLength, table.length, table.pageOffset, table.pageCount())
//! expect: 3 8192 0 1
//! emitted-lacks: gea::Value::box
