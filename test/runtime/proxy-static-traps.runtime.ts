//! expect: get-trap x=42
//! expect: get-trap other threw: no such key: y
//! expect: set-trap threw: read-only
//! expect: no-get-trap a=1 b=two
//! expect: in-no-has a=true z=false
//! expect: kerberos missing: kerberos is not installed
//! expect: error-module key=present
//! expect: error-module set threw: kerberos is not installed

// `new Proxy(target, handler)` compiled statically: the handler is an object
// literal, so which traps exist is known at compile time and every access on
// the proxy either calls its trap or loads the target natively. mongodb's
// `deps.ts` `makeErrorModule` is the shape this exists for.

class MissingDependencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingDependencyError'
  }
}

const withGet = new Proxy(
  { x: 1, y: 2 },
  {
    get: (_: any, key: any) => {
      if (key === 'x') return 42
      throw new Error('no such key: ' + String(key))
    }
  }
)
console.log('get-trap x=' + withGet.x)
try {
  console.log('unexpected ' + withGet.y)
} catch (error) {
  console.log('get-trap other threw: ' + (error as Error).message)
}

const readOnly = new Proxy(
  { x: 1 },
  {
    set: () => {
      throw new Error('read-only')
    }
  }
)
try {
  readOnly.x = 5
  console.log('unexpected set')
} catch (error) {
  console.log('set-trap threw: ' + (error as Error).message)
}

const plain = new Proxy({ a: 1, b: 'two' }, {})
console.log('no-get-trap a=' + plain.a + ' b=' + plain.b)
console.log('in-no-has a=' + ('a' in plain) + ' z=' + ('z' in plain))

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

function loadKerberos(): KerberosModule {
  throw new Error('Cannot find module kerberos')
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

const kerberos = getKerberos()
if ('kModuleError' in kerberos) {
  console.log('kerberos missing: ' + kerberos.kModuleError.message)
} else {
  console.log('kerberos loaded: ' + kerberos.initializeClient('svc'))
}

const errorModule = makeErrorModule(new MissingDependencyError('kerberos is not installed'))
console.log('error-module key=' + (errorModule.kModuleError === undefined ? 'absent' : 'present'))
try {
  errorModule.kModuleError = 1
  console.log('unexpected set')
} catch (error) {
  console.log('error-module set threw: ' + (error as Error).message)
}
