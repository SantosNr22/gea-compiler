let constructions = 0
class Client {
  constructor(readonly options: { callback: () => number }) {
    constructions++
  }
}
class Owner {
  client = new Client({ callback: () => 7 })
  callback = (() => {
    constructions++
    return () => 9
  })()
  direct = () => 11
}
const owner = new Owner()
console.log(constructions)
console.log(owner.client.options.callback())
console.log(owner.callback())
console.log(owner.direct())
console.log(constructions)
//! expect: 2
//! expect: 7
//! expect: 9
//! expect: 11
//! expect: 2
