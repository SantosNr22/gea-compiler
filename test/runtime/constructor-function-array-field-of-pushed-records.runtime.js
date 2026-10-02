// memory-pager's `function Pager () { this.updates = [] }`: an array field of
// a constructor-function class, later pushed page records and popped back.
function Page(i, buf) {
  this.offset = i * buf.length
  this.buffer = buf
  this.updated = false
}

function Pager(pageSize) {
  if (!(this instanceof Pager)) return new Pager(pageSize)
  this.updates = []
  this.pageSize = pageSize || 1024
}

Pager.prototype.updated = function (page) {
  if (page.updated || !this.updates) return
  page.updated = true
  this.updates.push(page)
}

function Tracker() {
  // sparse-bitfield: `this.pages = pager(size)`, called without `new`, and
  // only ever `updated(page)` -- lastUpdate is never reached.
  this.pages = Pager(4)
}
var tracker = new Tracker()
tracker.pages.updated(new Page(0, new Uint8Array(4)))
tracker.pages.updated(new Page(3, new Uint8Array(4)))
console.log(tracker.pages.updates.length)
//! expect: 2
