export {}

// This module does write its loader, so an invocation the flow cannot resolve
// may be that writer. Without one, nothing could replace `require` and every
// read would be static (`requireWriters` in commonjs-require.ts).
function replaceLoader() {
  require = (specifier: string) => ({ specifier })
}

let left: any
let right: any
left = right()
right = left()
left()
require('./node_modules/conditional-choice/require')
