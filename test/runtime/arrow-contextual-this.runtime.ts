//! expect: lexical and call-site receivers preserved
type Target = { count: number; handler: Handler | null }
type Handler = (this: Target, amount: number) => void
class Counter {
  count = 1
  bind(target: Target) {
    target.handler = (amount) => {
      this.count += amount
    }
  }
}
const counter = new Counter()
const source: Target = { count: 100, handler: null }
counter.bind(source)
if (source.handler) source.handler(7)
console.log('arrow counts: ' + counter.count + ', ' + source.count)
if (counter.count !== 8 || source.count !== 100) throw new Error('contextual this replaced the arrow lexical receiver')
source.handler = function (amount) {
  this.count += amount
}
source.handler(2)
console.log('ordinary counts: ' + counter.count + ', ' + source.count)
if (Number(source.count) !== 102 || counter.count !== 8) throw new Error('ordinary callback lost its call-site receiver')
console.log('lexical and call-site receivers preserved')
