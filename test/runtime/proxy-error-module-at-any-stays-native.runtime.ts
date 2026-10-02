//! expect: kerberos missing: kerberos is not installed
//! expect: zstd missing: zstd is not installed
//! expect: zstd get threw: zstd is not installed
//! expect: kerberos set threw: kerberos is not installed

// mongodb's `deps.ts`: `makeErrorModule` returns `new Proxy(props, handler)`
// whose trap parameters are annotated `any`, so the checker infers
// `Proxy<any>` and the function returns `any`. Its result then flows into
// several optional-dependency slots of DIFFERENT module types, so no single
// use narrows that `any`: it derives to the box. The proxy is still minted
// natively from its target and handler (no --dynamic-fallback), and each slot
// carries it as a `proxy-object` arm beside its own declared module type.

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
  initializeClient(service: string): string
}
type Kerberos = KerberosModule | { kModuleError: MissingDependencyError }

interface ZStandardLib {
  compress(level: number): number
}
type ZStandard = ZStandardLib | { kModuleError: MissingDependencyError }

function loadKerberos(): KerberosModule {
  throw new Error('Cannot find module kerberos')
}
function loadZstd(): ZStandardLib {
  throw new Error('Cannot find module zstd')
}

function getKerberos(): Kerberos {
  let kerberos: Kerberos
  try {
    kerberos = loadKerberos()
  } catch {
    kerberos = makeErrorModule(new MissingDependencyError('kerberos is not installed'))
  }
  return kerberos
}

function getZstdLibrary(): ZStandard {
  let zstd: ZStandard
  try {
    zstd = loadZstd()
  } catch {
    zstd = makeErrorModule(new MissingDependencyError('zstd is not installed'))
  }
  return zstd
}

const kerberos = getKerberos()
if ('kModuleError' in kerberos) console.log('kerberos missing: ' + kerberos.kModuleError.message)
else console.log('kerberos loaded: ' + kerberos.initializeClient('svc'))

const zstd = getZstdLibrary()
if ('kModuleError' in zstd) {
  console.log('zstd missing: ' + zstd.kModuleError.message)
  try {
    console.log('unexpected ' + (zstd as unknown as ZStandardLib).compress(1))
  } catch (error) {
    console.log('zstd get threw: ' + (error as MissingDependencyError).message)
  }
} else console.log('zstd loaded: ' + zstd.compress(1))

try {
  ;(kerberos as { kModuleError: MissingDependencyError }).kModuleError = new MissingDependencyError('other')
  console.log('unexpected set')
} catch (error) {
  console.log('kerberos set threw: ' + (error as MissingDependencyError).message)
}
