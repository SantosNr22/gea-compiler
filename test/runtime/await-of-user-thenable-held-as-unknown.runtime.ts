// `await` OF A USER-WRITTEN THENABLE HELD AS `unknown` OR `any`.
//
// ECMA-262 27.2.1.3.2 PromiseResolve: an object with a callable `then` is
// adopted by calling it. A value the program declares `unknown`/`any` is the
// dynamic carrier, so the check has to be made against the live value.

const thenable: unknown = {
  then(resolve: (value: number) => void): void {
    resolve(7)
  }
}
const anyThenable: any = {
  then(resolve: (value: string) => void): void {
    resolve('any')
  }
}
const rejecting: unknown = {
  then(_resolve: (value: number) => void, reject: (reason: unknown) => void): void {
    reject(new Error('thenable-rejected'))
  }
}
const plain: unknown = 5

async function main(): Promise<void> {
  console.log(`unknown=${await thenable}`)
  console.log(`any=${await anyThenable}`)
  console.log(`plain=${await plain}`)
  try {
    await rejecting
    console.log('rejecting=resolved')
  } catch (error) {
    console.log(`rejecting=${(error as Error).message}`)
  }
}
main()
//! expect: unknown=7
//! expect: any=any
//! expect: plain=5
//! expect: rejecting=thenable-rejected
