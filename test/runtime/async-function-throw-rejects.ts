// An async function's body that THROWS completes its promise REJECTED
// (27.7.5.1 AsyncFunctionStart: an abrupt completion rejects the capability).
// The throw must never escape the call as a C++ exception: every rejection
// observer -- `then(ok, err)`, `then(undefined, err)`, `catch`, and `await`
// under try/catch -- sees it as a rejection.

async function fails(): Promise<number> {
  throw new Error('x')
}

async function failsAfterAwait(): Promise<number> {
  await Promise.resolve(0)
  throw new Error('y')
}

//! expect: err x
fails().then(
  (v) => console.log('ok', v),
  (e) => console.log('err', (e as Error).message)
)

//! expect: undefined-ok err x
fails().then(undefined, (e) => console.log('undefined-ok err', (e as Error).message))

//! expect: catch y
failsAfterAwait().catch((e) => console.log('catch', (e as Error).message))

async function main(): Promise<void> {
  try {
    await fails()
    console.log('unreachable')
  } catch (e) {
    //! expect: caught x
    console.log('caught', (e as Error).message)
  }
  try {
    await failsAfterAwait()
  } catch (e) {
    //! expect: caught y
    console.log('caught', (e as Error).message)
  }
}

class Session {
  async end(): Promise<string> {
    throw new Error('method')
  }
}

const arrow = async (): Promise<string> => {
  throw new Error('arrow')
}

//! expect: method rejected method
new Session().end().then(
  (v) => console.log('method ok', v),
  (e) => console.log('method rejected', (e as Error).message)
)

//! expect: arrow rejected arrow
arrow().catch((e) => console.log('arrow rejected', (e as Error).message))

// A plain function returning a promise still throws AT THE CALL: only an
// async body settles its abrupt completion as a rejection.
function syncThrow(): Promise<number> {
  throw new Error('sync')
}
try {
  syncThrow().catch(() => console.log('wrongly rejected'))
} catch (e) {
  //! expect: sync threw sync
  console.log('sync threw', (e as Error).message)
}

main()
