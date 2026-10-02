// A NAMED import out of a module whose `export =` is a function: the binding
// is the function object's own property, which the module assigned as an
// expando -- mongodb's `import { saslprep } from '@mongodb-js/saslprep'`.
import { normalize } from './_export-assigned-function-with-expando'

console.log(`[${normalize('  a b  ')}]`)
console.log(normalize('xy', { upper: true }))

//! expect: [a b]
//! expect: XY
