//! expect: 5
//! emitted-lacks: gea::Value::box

class CounterBase {
  value = 2
  add(amount: number) {
    this.value += amount
  }
}
interface CounterView {
  value: number
  add(amount: number): void
}
class Counter extends (CounterBase as new () => CounterView) {
  constructor() {
    super()
    this.add(3)
  }
}
console.log(new Counter().value)
