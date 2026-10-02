// A COMPUTED KEY DEFINED BEFORE A DECLARED FIELD MUST ENUMERATE FIRST.
//
// `{ [k]: 1, m }` over `k: 'hello' | 'ismaster'` is typed `{ [x: string]:
// number; m: number }`. ECMA-262 OrdinaryOwnPropertyKeys lists string keys in
// creation order, so node prints `order=hello,m`. Both names the key can take
// are laid out as optional members ahead of `m` (`structural-creation-order.ts`'s
// phantoms), instead of index-sidecar entries that enumerate after every
// declared field.

function command(hello: boolean, m: number): string {
  const cmd = { [hello ? 'hello' : 'ismaster']: 1, m }
  return Object.keys(cmd).join(',')
}

console.log(`order=${command(true, 3)}`)
//! expect: order=hello,m
