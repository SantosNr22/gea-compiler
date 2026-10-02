// A borrowed executor environment is a stack local scoped to the
// constructor call -- so it must still be there for the whole of that call,
// including when the executor throws instead of returning normally.
// `PromiseConstructor::constructVoid`'s `catch (...)` wraps the call the
// same way whether the executor's environment is heap or borrowed.
function makeFailure(reason: string, code: number): Promise<number> {
  return new Promise<number>((_resolve, _reject) => {
    // Two captures (`reason`, `code`) from the enclosing frame, read only
    // while building the message -- never stored, never returned.
    throw new Error(`${reason}:${code}`)
  })
}

async function run(): Promise<void> {
  try {
    await makeFailure('boom', 7)
  } catch (error) {
    console.log('caught', (error as Error).message)
  }
}

run()

//! expect: caught boom:7
//! emitted-has: gea::packBorrowedEnvironment
