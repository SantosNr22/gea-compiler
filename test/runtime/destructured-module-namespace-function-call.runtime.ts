// A function destructured out of a module namespace TYPE and called bare --
// mongodb's `const { initializeClient } = krb; await initializeClient(spn,
// initOptions)` in cmap/auth/gssapi.ts, where `krb` is `typeof
// import('kerberos') | { kModuleError }` narrowed by `'kModuleError' in krb`.
// `kerberos` is types-only in the native build, so the module arm is never
// the live one; the call must still compile, and a module's exported function
// has no receiver, so the bare call supplies none. (mongodb's own `krb` also
// carries the `makeErrorModule` Proxy arm, whose `in`/destructuring loads are
// a separate open row.)
//! expect: missing
type Kerberos = typeof import('./_destructured-ambient-module') | { kModuleError: Error }

let krb: Kerberos | undefined

function loadKrb(): Kerberos {
  if (!krb) krb = { kModuleError: new Error('missing') }
  return krb
}

async function makeClient(): Promise<string> {
  const loaded = loadKrb()
  if ('kModuleError' in loaded) {
    throw loaded['kModuleError']
  }
  const { initializeClient } = loaded
  const initOptions = {}
  Object.assign(initOptions, { user: 'alice' })
  const client = await initializeClient('svc@host', initOptions)
  return client.name
}

async function main(): Promise<void> {
  try {
    console.log(await makeClient())
  } catch (error) {
    // node prints: missing
    console.log((error as Error).message)
  }
}
void main()
