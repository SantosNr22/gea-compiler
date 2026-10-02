// Without strictNullChecks the checker ERASES `null` from a type:
// `cond ? alloc(n) : null` reads as plain `Uint8Array`. The writers still
// store null, so the field's carrier must be able to hold it; a non-optional
// reference aborted the program the moment the null arm ran.

function alloc(n: number): Uint8Array {
  return new Uint8Array(n)
}

class Pool {
  zeros
  size: number
  constructor(n: number, eager: boolean) {
    this.size = n
    this.zeros = eager ? alloc(n) : null
  }
  zeroCount(): number {
    if (this.zeros === null) return -1
    return this.zeros.length
  }
}

//! expect: eager=4
console.log('eager=' + new Pool(4, true).zeroCount())
//! expect: lazy=-1
console.log('lazy=' + new Pool(4, false).zeroCount())

let cached = Math.random() > 2 ? alloc(2) : null
//! expect: local-null=true
console.log('local-null=' + (cached === null))
cached = alloc(3)
//! expect: local-len=3
console.log('local-len=' + cached.length)

class Holder {
  value: Uint8Array
  constructor(keep: boolean) {
    this.value = keep ? alloc(1) : undefined
  }
}
//! expect: undefined-field=true
console.log('undefined-field=' + (new Holder(false).value === undefined))
//! expect: kept-field=1
console.log('kept-field=' + new Holder(true).value.length)

class EntryCache {
  entry: Uint8Array
  constructor() {
    this.entry = alloc(5)
  }
  clear(): void {
    this.entry = null
  }
  size(): number {
    return this.entry === null ? 0 : this.entry.length
  }
}
const cache = new EntryCache()
//! expect: cache-before=5
console.log('cache-before=' + cache.size())
cache.clear()
//! expect: cache-after=0
console.log('cache-after=' + cache.size())

const pool: Uint8Array[] = []
const found = pool[0] || null
//! expect: or-null=true
console.log('or-null=' + (found === null))
