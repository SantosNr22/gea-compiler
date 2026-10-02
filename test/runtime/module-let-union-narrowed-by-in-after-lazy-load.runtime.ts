//! expect: compress: missing zstd
//! expect: decompress: missing zstd
//! expect: loads 1
//! expect: loaded: z(abc) u(xyz)
//! expect: loads 2

// mongodb's `compression.ts`, reduced to its shape: `let zstd: ZStandard` has
// no initializer, a helper fills it lazily, and each async caller narrows the
// union with `'kModuleError' in zstd` before calling through the library arm.
// The read carries `undefined` (the cell is unwritten until the loader runs),
// so the narrowing selects an arm out of `optional(tagged-union)`, and the
// union keeps the Proxy arm `makeErrorModule` puts there.

class MissingDependencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingDependencyError'
  }
}

type ZStandardLib = {
  compress(buf: string, level?: number): Promise<string>
  decompress(buf: string): Promise<string>
}

type ZStandard = ZStandardLib | { kModuleError: MissingDependencyError }

let installed = false
let loads = 0

// mongodb's `makeErrorModule`: the missing module is a Proxy whose every
// read but `kModuleError` throws, so the union also carries a proxy arm.
function makeErrorModule(error: any) {
  const props = error ? { kModuleError: error } : {}
  return new Proxy(props, {
    get: (_: any, key: any) => {
      if (key === 'kModuleError') {
        return error
      }
      throw error
    },
    set: () => {
      throw error
    }
  })
}

function getZstdLibrary(): ZStandardLib | { kModuleError: MissingDependencyError } {
  loads++
  let library: ZStandardLib | { kModuleError: MissingDependencyError }
  if (!installed) library = makeErrorModule(new MissingDependencyError('missing zstd'))
  else library = { kModuleError: new MissingDependencyError('unused') }
  if (!installed) return library
  return {
    compress: async (buf: string, level?: number) => `z(${buf})${level === undefined ? '' : ''}`,
    decompress: async (buf: string) => `u(${buf})`
  }
}

let zstd: ZStandard

function loadZstd(): void {
  if (!zstd) {
    zstd = getZstdLibrary()
  }
}

async function compress(data: string): Promise<string> {
  loadZstd()
  if ('kModuleError' in zstd) {
    throw zstd['kModuleError']
  }
  return await zstd.compress(data, 3)
}

async function decompress(data: string): Promise<string> {
  loadZstd()
  if ('kModuleError' in zstd) {
    throw zstd.kModuleError
  }
  return await zstd.decompress(data)
}

const failure = (error: unknown): string => (error instanceof MissingDependencyError ? error.message : 'unexpected')

async function main(): Promise<void> {
  console.log(`compress: ${await compress('abc').catch(failure)}`)
  console.log(`decompress: ${await decompress('abc').catch(failure)}`)
  console.log(`loads ${loads}`)
  installed = true
  zstd = getZstdLibrary()
  console.log(`loaded: ${await compress('abc')} ${await decompress('xyz')}`)
  console.log(`loads ${loads}`)
}

void main()
