//! expect: zstd compress: zstd is not installed
//! expect: zstd decompress: zstd is not installed
//! expect: gcp instance: gcp-metadata is not installed
//! expect: gcp absent: gcp-metadata is not installed

// mongodb's `deps.ts` error module read the way `compression.ts` and
// `providers/gcp.ts` read it: a METHOD off the module, called with typed
// arguments (`zstd.compress(buffer, level)`, `gcpMetadata.instance<T>({...})`).
// The Proxy `get` trap answers `any` -- the missing-dependency error, or it
// throws -- so the method the site calls is recovered from that box by the
// checked dynamic-callable bridge, which verifies it is a Function and adapts
// its frame; here the trap throws first, exactly as node does.

class MissingDependencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingDependencyError'
  }
}

function makeErrorModule(error: any) {
  const props = error ? { kModuleError: error } : {}
  return new Proxy(props, {
    get: (_: any, key: any) => {
      if (key === 'kModuleError') return error
      throw error
    },
    set: () => {
      throw error
    }
  })
}

type ZStandardLib = {
  compress(buf: Uint8Array, level?: number): Promise<Uint8Array>
  decompress(buf: Uint8Array): Promise<Uint8Array>
}
type ZStandard = ZStandardLib | { kModuleError: MissingDependencyError }

type GcpMetadata = { instance<T>(options?: string | { property: string }): Promise<T> } | { kModuleError: MissingDependencyError }

function loadModule(name: string): never {
  throw new Error('Cannot find module ' + name)
}

function getZstdLibrary(): ZStandard {
  let zstd: ZStandard
  try {
    zstd = loadModule('@mongodb-js/zstd')
  } catch {
    zstd = makeErrorModule(new MissingDependencyError('zstd is not installed'))
  }
  return zstd
}

function getGcpMetadata(): GcpMetadata {
  try {
    return loadModule('gcp-metadata')
  } catch {
    return makeErrorModule(new MissingDependencyError('gcp-metadata is not installed'))
  }
}

let zstdModule: ZStandard | undefined

function loadZstd(): ZStandard {
  zstdModule ??= getZstdLibrary()
  return zstdModule
}

async function compress(data: Uint8Array): Promise<Uint8Array> {
  const zstd = loadZstd()
  if ('kModuleError' in zstd) throw zstd['kModuleError']
  return await zstd.compress(data, 3)
}

async function decompress(data: Uint8Array): Promise<Uint8Array> {
  const zstd = loadZstd()
  if ('kModuleError' in zstd) throw zstd['kModuleError']
  return await zstd.decompress(data)
}

async function loadGcpCredentials(): Promise<string> {
  const gcpMetadata = getGcpMetadata()
  if ('kModuleError' in gcpMetadata) return 'gcp absent: ' + gcpMetadata.kModuleError.message
  const { access_token: accessToken } = await gcpMetadata.instance<{ access_token: string }>({
    property: 'service-accounts/default/token'
  })
  return accessToken
}

// The error module answers `in` through its target, which does hold
// `kModuleError`; a module that did not would reach the method read, and the
// trap throws there. Read once more without the guard to take that path.
async function loadGcpUnguarded(): Promise<string> {
  const gcpMetadata = getGcpMetadata()
  if ('instance' in gcpMetadata) {
    const { access_token: accessToken } = await gcpMetadata.instance<{ access_token: string }>({ property: 'token' })
    return accessToken
  }
  return (gcpMetadata.kModuleError as MissingDependencyError).message
}

async function main(): Promise<void> {
  const data = new Uint8Array([1, 2, 3])
  try {
    console.log('unexpected ' + (await compress(data)).length)
  } catch (error) {
    console.log('zstd compress: ' + (error as MissingDependencyError).message)
  }
  try {
    console.log('unexpected ' + (await decompress(data)).length)
  } catch (error) {
    console.log('zstd decompress: ' + (error as MissingDependencyError).message)
  }
  console.log('gcp instance: ' + (await loadGcpUnguarded()))
  console.log(await loadGcpCredentials())
}

void main()
