// A member read off a module namespace that is itself reached through an
// import binding: `import { BSON } from 'bson'` (bson's index.ts does
// `import * as BSON from './bson'; export { BSON }`) followed by
// `BSON.serialize(...)`, and `dns.promises.lookup(...)` where `promises` is a
// namespace re-exported by `node:dns`. Both name the member's own binding --
// the namespace object is a path, and no cell holds it.
import { inner } from './_namespace-reexport-outer'
import * as outer from './_namespace-reexport-outer'

console.log(inner.serialize(1), inner.onDemand.twice(3), inner.TIMEOUT)
console.log(outer.inner.serialize(4), outer.inner.onDemand.twice(5), outer.inner.TIMEOUT === 'ETIMEOUT')
const f = outer.inner.serialize
console.log(f(10))

//! expect: 2 6 ETIMEOUT
//! expect: 5 10 true
//! expect: 11
