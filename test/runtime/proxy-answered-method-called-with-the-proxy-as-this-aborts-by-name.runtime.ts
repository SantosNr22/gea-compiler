//! expect-abort
//! expect: a method read off a Proxy is called with the Proxy as `this`, which no native frame can hold

// A Proxy whose `get` trap really answers a function: the language calls it
// with the proxy itself as `this`. A native Proxy has no box of its own, so no
// native receiver slot can hold it, and the call aborts by name -- never a
// load of the union's other arm, and never a catchable TypeError the program
// does not have.

type ZStandardLib = {
  compress(buf: Uint8Array, level?: number): Promise<Uint8Array>
}
type ZStandard = ZStandardLib | { kModuleError: Error }

function makeShimModule(impl: any): ZStandard {
  return new Proxy({}, { get: (_: any, key: any) => (key === 'kModuleError' ? undefined : impl) })
}

function getLibrary(real: boolean): ZStandard {
  if (real) return { compress: async (buf: Uint8Array) => buf }
  return makeShimModule(async (buf: Uint8Array, _level?: number): Promise<Uint8Array> => buf)
}

async function main(): Promise<void> {
  const data = new Uint8Array([1, 2, 3])
  const lib = getLibrary(data.length === 0)
  if ('kModuleError' in lib) return
  try {
    console.log('compressed ' + (await lib.compress(data, 3)).length)
  } catch {
    console.log('caught')
  }
}

void main()
