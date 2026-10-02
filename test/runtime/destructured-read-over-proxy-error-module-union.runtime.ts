//! expect: guarded: kerberos is not installed
//! expect: unguarded: kerberos is not installed
//! expect: loaded: svc@host

// mongodb's cmap/auth/gssapi.ts: `const { initializeClient } = krb`, where
// `krb` is deps.ts's `Kerberos` -- a module type or `{ kModuleError }` -- and
// holds either the loaded module or `makeErrorModule`'s Proxy. The pattern's
// own `[[Get]]` reads the union, so the proxy arm runs its `get` trap (which
// throws the stored error, as node does) and every other arm reads its field.

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

interface KerberosClient {
  step(challenge: string): Promise<string>
}
// kerberos's lib/index.js implements it as `promisifiedInitializeClient.call(
// this, ...)`, so its `this` is `any` and the convention states a receiver; the
// destructured bare call passes `undefined` there, as the language does.
interface KerberosModule {
  initializeClient(this: any, service: string, options?: { user?: string }): Promise<KerberosClient>
}
type Kerberos = KerberosModule | { kModuleError: MissingDependencyError }

const installed: KerberosModule = {
  initializeClient: async function (this: any, service: string) {
    const bound = this === undefined ? '' : '?'
    return { step: async (challenge: string) => service + bound + challenge }
  }
}

function getKerberos(present: boolean): Kerberos {
  let kerberos: Kerberos
  try {
    if (!present) throw new Error('Cannot find module kerberos')
    kerberos = installed
  } catch {
    kerberos = makeErrorModule(new MissingDependencyError('kerberos is not installed'))
  }
  return kerberos
}

let krb: Kerberos

async function makeKerberosClient(): Promise<KerberosClient> {
  if ('kModuleError' in krb) {
    throw krb['kModuleError']
  }
  const { initializeClient } = krb
  return await initializeClient('svc', {})
}

async function unguarded(): Promise<KerberosClient> {
  const { initializeClient } = krb as KerberosModule
  return await initializeClient('svc')
}

async function main(): Promise<void> {
  krb = getKerberos(false)
  try {
    await makeKerberosClient()
    console.log('guarded: unexpected')
  } catch (error) {
    console.log('guarded: ' + (error as MissingDependencyError).message)
  }
  try {
    await unguarded()
    console.log('unguarded: unexpected')
  } catch (error) {
    console.log('unguarded: ' + (error as MissingDependencyError).message)
  }
  krb = getKerberos(true)
  const client = await makeKerberosClient()
  console.log('loaded: ' + (await client.step('@host')))
}

void main()
