//! expect: enum 0 1 2 first alias -3 below
//! expect: computed 7 9 10 2 first next
//! expect: text ready ready 4 four
//! emitted-lacks: gea::Value::box

export {}

enum Counter {
  zero,
  first,
  second,
  alias = 2,
  below = -3
}
console.log('enum', Counter.zero, Counter.first, Counter.second, Counter[1], Counter[2], Counter.below, Counter[-3])

let calls = 0
function seed() {
  calls++
  return 7
}
enum Computed {
  first = seed(),
  next = first + calls++ + 1,
  closure = (() => next + 1)()
}
console.log('computed', Computed.first, Computed.next, Computed.closure, calls, Computed[7], Computed[9])

enum Text {
  ready = 'ready',
  alias = ready,
  four = 4
}
console.log('text', Text.ready, Text.alias, Text.four, Text[4])
