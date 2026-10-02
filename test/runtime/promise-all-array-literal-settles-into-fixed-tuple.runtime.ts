// `Promise.all([a, b])` over an array literal is typed as a fixed tuple, which
// is laid out as a struct, while the runtime settles an array: the result is
// re-laid field by field (emit-host-invoke.ts's `promiseAllIntoTupleText`).
async function main(): Promise<void> {
  const [count, next] = await Promise.all([Promise.resolve(41), Promise.resolve(1)])
  console.log(count + next, 'gea'.toUpperCase())
  const pair = await Promise.all([Promise.resolve(2), Promise.resolve(3)])
  console.log(pair[0] * pair[1], pair.length)
}

main()

//! expect: 42 GEA
//! expect: 6 2
