// memory-pager's `Pager.prototype.updated(page)` with the page parameter
// stated as the inline record it is read as, not as the `Page` constructor.
// The `Page` instance a caller hands over is the same object: the body's
// `page.updated = true` must be seen by the caller's second call, which then
// pushes nothing, and the page `updates` holds IS the caller's. A structural
// view of the instance into the record's struct is a copy, which swallowed the
// write and pushed the page twice.
/**
 * @param {number} [pageSize]
 * @param [opts]
 */
function Pager(pageSize, opts) {
  if (!(this instanceof Pager)) return new Pager(pageSize, opts)
  this.pageSize = pageSize || 4
  this.pages = []
  this.updates = []
  this.deduplicate = opts ? opts.deduplicate : null
  this.zeros = this.deduplicate ? alloc(this.deduplicate.length) : null
}

function alloc(n) {
  return new Uint8Array(n)
}

function sameBytes(a, b) {
  if (a.length !== b.length) return false
  for (var k = 0; k < a.length; k++) if (a[k] !== b[k]) return false
  return true
}

/** @param {Uint8Array} buf */
function bytes(buf) {
  var text = ''
  for (var k = 0; k < buf.length; k++) text += (k ? ',' : '') + buf[k]
  return text
}

function truncate(buf, len) {
  if (buf.length === len) return buf
  var cpy = alloc(len)
  for (var k = 0; k < len && k < buf.length; k++) cpy[k] = buf[k]
  return cpy
}

/**
 * @param {number} i
 * @param {Uint8Array} buffer
 */
function Page(i, buffer) {
  this.offset = i * buffer.length
  this.buffer = buffer
  this.updated = false
  this.deduplicate = 0
}

/** @param {{ offset: number, buffer: Uint8Array, updated: boolean, deduplicate: number }} page */
Pager.prototype.updated = function (page) {
  while (this.deduplicate && page.buffer[page.deduplicate] === this.deduplicate[page.deduplicate]) {
    page.deduplicate++
    if (page.deduplicate === this.deduplicate.length) {
      page.deduplicate = 0
      if (sameBytes(page.buffer, this.deduplicate)) page.buffer = this.deduplicate
      break
    }
  }
  if (page.updated || !this.updates) return
  page.updated = true
  this.updates.push(page)
}

/** @param {number} i */
Pager.prototype.get = function (i) {
  var page = this.pages[i]
  if (!page) page = this.pages[i] = new Page(i, alloc(this.pageSize))
  return page
}

/**
 * @param {number} i
 * @param {Uint8Array} buf
 */
Pager.prototype.set = function (i, buf) {
  if (this.zeros && sameBytes(buf, this.zeros)) {
    this.pages[i] = undefined
    return
  }
  if (this.deduplicate && sameBytes(buf, this.deduplicate)) {
    buf = this.deduplicate
  }
  var page = this.pages[i]
  var b = truncate(buf, this.pageSize)
  if (page) page.buffer = b
  else this.pages[i] = new Page(i, b)
}

var pager = Pager(4)
pager.set(1, new Uint8Array([1, 2, 3, 4, 5]))
pager.set(2, new Uint8Array([9]))
var one = pager.get(1)
pager.updated(one)
pager.updated(one)
console.log(bytes(one.buffer), bytes(pager.get(2).buffer), pager.get(0).offset, pager.updates.length, pager.zeros)
console.log(one.updated, pager.updates[0] === one, pager.get(1) === one)
//! expect: 1,2,3,4 9,0,0,0 0 1 null
//! expect: true true true
