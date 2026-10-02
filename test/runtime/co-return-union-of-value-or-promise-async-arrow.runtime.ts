// The sibling shape `co-return-union-of-value-or-promise-settles-same-tick.
// runtime.ts` pins for an ordinary async function's `ReturnStatement`
// (`contributeReturn`), asked here of an ASYNC ARROW's concise body instead
// (`contributeImplicitReturn`, `semantics/normalize/producers/control.ts`):
// there is no `ReturnStatement` node at all, so the 'return' operation is
// minted directly from the body expression. The slot census
// (`projection/slots.ts`'s `return` case) keys only on the caller's ABI and
// the operand's own carrier, never on which producer minted the operation, so
// this should settle exactly the same way -- a plain-value arm resolves, a
// promise arm adopts -- but is pinned separately since nothing else exercises
// a union return out of a concise arrow body.
const relay = async (x: string | Promise<string>): Promise<string> => x

async function main(): Promise<void> {
  console.log('value-arm:' + (await relay('v')))
  console.log('promise-arm:' + (await relay(Promise.resolve('p'))))
}

main()

//! expect: value-arm:v
//! expect: promise-arm:p
