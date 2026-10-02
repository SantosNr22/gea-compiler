// memory-pager's shape. Every caller omits `opts`, so `this.deduplicate` only
// ever holds `null`: the ternary's condition is decided by that absence, and
// each `this.deduplicate && ...` guard is dead code whose right side (a
// boolean, a write of the `null` into a list-typed field) must not have to
// convert into the guard's `null`. `@param [opts]` states optionality and no
// type, which is how `declarationOverlayTransform` writes a parameter the
// package's `@types` leave out. `var page = arr && arr[first]` reads a slot of an
// untyped page tree -- a sub-array or a `Page` -- so the local and `get`'s
// return stay dynamic rather than asserting the empty slot is a `Page`.
/**
 * @param {number} [pageSize]
 * @param [opts]
 */
function Pager(pageSize, opts) {
  if (!(this instanceof Pager)) return new Pager(pageSize, opts)
  this.pageSize = pageSize || 4
  this.level = 0
  this.pages = new Array(4)
  this.first = 0
  this.deduplicate = opts ? opts.deduplicate : null
  this.zeros = this.deduplicate ? zeros(this.deduplicate.length) : null
}

function zeros(n) {
  var list = []
  for (var k = 0; k < n; k++) list.push(0)
  return list
}

function sameList(a, b) {
  if (a.length !== b.length) return false
  for (var k = 0; k < a.length; k++) if (a[k] !== b[k]) return false
  return true
}

function Page(buffer) {
  this.size = buffer.length
  this.buffer = buffer
}

Pager.prototype._array = function (i, noAllocate) {
  this.first = i & 3
  var arr = this.pages
  if (this.level > 0) {
    var next = arr[0]
    if (!next) {
      if (noAllocate) return
      next = arr[0] = new Array(4)
    }
    arr = next
  }
  return arr
}

Pager.prototype.get = function (i, noAllocate) {
  var arr = this._array(i, noAllocate)
  var first = this.first
  var page = arr && arr[first]
  if (arr && !page && !noAllocate) page = arr[first] = new Page(zeros(this.pageSize))
  return page
}

Pager.prototype.set = function (i, buf) {
  var arr = this._array(i, false)
  if (!arr) return
  var first = this.first
  if (this.deduplicate && sameList(buf, this.deduplicate)) buf = this.deduplicate
  var page = arr[first]
  if (this.zeros && sameList(buf, this.zeros)) return
  if (page) page.buffer = buf
  else arr[first] = new Page(buf)
}

var pager = new Pager(4)
pager.set(1, [1, 2, 3, 4])
console.log(pager.get(1).buffer.join(','), pager.get(2).size, pager.get(3, true) === undefined, pager.zeros)
//! expect: 1,2,3,4 4 true null
