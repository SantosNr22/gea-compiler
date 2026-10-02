//! expect: 6
//! expect: visited 1,3,4
//! expect: receiver 6
let sum = 0
new Set<number>([1, 2, 3]).forEach((value) => {
  sum += value
})
console.log(sum)

const values = new Set<number>([1, 2, 3])
const visited: number[] = []
values.forEach((value, key, owner) => {
  if (value !== key || owner !== values) throw new Error('incorrect callback frame')
  visited.push(value)
  if (value === 1) {
    owner.delete(2)
    owner.add(4)
  }
})
console.log('visited', visited.join(','))
const state = { total: 0 }
new Set<number>([1, 2, 3]).forEach(function (this: { total: number }, value: number) {
  this.total += value
}, state)
console.log('receiver', state.total)
