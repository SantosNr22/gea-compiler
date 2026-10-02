// Helper module for namespace-member-through-reexported-namespace.runtime.ts:
// re-exports a namespace import by name, the way bson's index.ts exports `BSON`
// and node-compat's dns.ts exports `promises`.
import * as inner from './_namespace-reexport-inner'
export { inner }
