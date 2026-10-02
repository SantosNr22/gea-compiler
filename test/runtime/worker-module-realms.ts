let count = 0
class Counter {
  static value = 0
}
function next(): string {
  count += 1
  Counter.value += 1
  return `${count}:${Counter.value}`
}
console.log(next())
