//! expect: before: true
//! expect: created 1
//! expect: count 3
//! expect: lazy: 41 41

// `static x: T` with no initializer holds `undefined` until written; the
// checker never requires a static to be definitely assigned. The lazily
// filled singleton and the `??=` cache both depend on reading that
// `undefined` back, whatever the declared type claims.

class Counter {
  private static shared: Counter
  static created = 0
  count = 0

  static get instance(): Counter {
    if (!Counter.shared) {
      Counter.created++
      Counter.shared = new Counter()
    }
    return Counter.shared
  }
}

class Lazy {
  static answer: number

  static get value(): number {
    Lazy.answer ??= 41
    return Lazy.answer
  }
}

class Probe {
  static unset: string
}

console.log(`before: ${Probe.unset === undefined}`)
Counter.instance.count++
Counter.instance.count++
Counter.instance.count++
console.log(`created ${Counter.created}`)
console.log(`count ${Counter.instance.count}`)
console.log(`lazy: ${Lazy.value} ${Lazy.value}`)
