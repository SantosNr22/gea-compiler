//! expect: kerberos missing: kerberos is not installed
//! expect: kerberos loaded: svc@host
//! expect: zstd missing: zstd is not installed
//! expect: zstd loaded: 3 bytes at level 5
//! expect: zstd other: TypeError
//! emitted-has: a dynamic value is none of the union's object arms

// mongodb's deps.ts: `kerberos = require('kerberos')` and `ZStandard =
// require('@mongodb-js/zstd')`, where `require` answers `any` and the slot is
// `Module | { kModuleError }` -- carried as the module's record, the error
// record, and `makeErrorModule`'s Proxy. The `any` enters the union by a
// checked conversion: an object is adopted as the record arm whose required
// keys it holds, a box can never hold the native Proxy, and anything else is
// a TypeError. The union itself is never boxed.

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

interface KerberosModule {
  initializeClient(service: string): Promise<string>
}
type Kerberos = KerberosModule | { kModuleError: MissingDependencyError }

type ZStandardLib = {
  compress(buf: Uint8Array, level?: number): Promise<string>
  decompress(buf: Uint8Array): Promise<Uint8Array>
}
type ZStandard = ZStandardLib | { kModuleError: MissingDependencyError }

const installed: Record<string, any> = {
  kerberos: { initializeClient: async (service: string) => service + '@host' },
  zstd: {
    compress: async (buf: Uint8Array, level?: number) => buf.length + ' bytes at level ' + level,
    decompress: async (buf: Uint8Array) => buf
  },
  other: 42
}

function loadOptional(name: string): any {
  const found = installed[name]
  if (found === undefined) throw new Error('Cannot find module ' + name)
  return found
}

function getKerberos(name: string): Kerberos {
  let kerberos: Kerberos
  try {
    kerberos = loadOptional(name)
  } catch (error) {
    kerberos = makeErrorModule(new MissingDependencyError('kerberos is not installed'))
  }
  return kerberos
}

function getZstdLibrary(name: string): ZStandardLib | { kModuleError: MissingDependencyError } {
  let ZStandard: ZStandardLib | { kModuleError: MissingDependencyError }
  try {
    ZStandard = loadOptional(name)
  } catch (error) {
    ZStandard = makeErrorModule(new MissingDependencyError('zstd is not installed'))
  }
  return ZStandard
}

// The same slot filled outside the `try`: a module that is none of the arms
// is a TypeError -- node's from the `in` below, this one's from the checked
// conversion itself -- and the caller catches it either way.
function getZstdUnguarded(name: string): ZStandard {
  let ZStandard: ZStandard = makeErrorModule(new MissingDependencyError('zstd is not installed'))
  ZStandard = loadOptional(name)
  return ZStandard
}

async function kerberos(name: string): Promise<string> {
  const krb = getKerberos(name)
  if ('kModuleError' in krb) return 'kerberos missing: ' + krb.kModuleError.message
  return 'kerberos loaded: ' + (await krb.initializeClient('svc'))
}

async function zstd(name: string): Promise<string> {
  const lib: ZStandard = getZstdLibrary(name)
  if ('kModuleError' in lib) return 'zstd missing: ' + lib.kModuleError.message
  return 'zstd loaded: ' + (await lib.compress(new Uint8Array([1, 2, 3]), 5))
}

async function zstdUnguarded(name: string): Promise<string> {
  const lib = getZstdUnguarded(name)
  if ('kModuleError' in lib) return 'zstd missing: ' + lib.kModuleError.message
  return 'zstd loaded: ' + (await lib.compress(new Uint8Array([1, 2, 3]), 5))
}

async function main(): Promise<void> {
  console.log(await kerberos('absent-kerberos'))
  console.log(await kerberos('kerberos'))
  console.log(await zstd('absent-zstd'))
  console.log(await zstd('zstd'))
  try {
    console.log('zstd other: ' + (await zstdUnguarded('other')))
  } catch (error) {
    console.log('zstd other: ' + (error as Error).name)
  }
}

void main()

export {}
