export {}

// This module does write its loader, so an invocation the flow cannot resolve
// may be that writer. Without one, nothing could replace `require` and every
// read would be static (`requireWriters` in commonjs-require.ts).
function replaceLoader() {
  require = (specifier: string) => ({ specifier })
}

function safe() {}

const { bind: invoke } = safe
Reflect.deleteProperty(Function.prototype, 'bind')
invoke(undefined)()
require('./node_modules/conditional-choice/require')
