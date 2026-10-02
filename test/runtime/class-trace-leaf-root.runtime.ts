// A class nothing derives from, evaluated once, whose fields reach only
// scalars, strings and arrays of those is a leaf of the cycle collector
// (`gea_traceLeaf`, `records.ts`'s `leafEligibleClassesOf`). The class that
// holds a callable is not, so the marker appears exactly once.
class Sample {
  id: number
  name: string
  tags: string[]
  constructor(id: number, name: string, tags: string[]) {
    this.id = id
    this.name = name
    this.tags = tags
  }
  total(): number {
    return this.id + this.tags.length + this.name.length
  }
}

class Registry {
  handlers: (() => number)[] = []
  samples: Sample[] = []
}

function churn(): number {
  let sum = 0
  for (let i = 0; i < 3000; i++) {
    const registry = new Registry()
    const sample = new Sample(i, 's' + i, ['a', 'b'])
    registry.samples.push(sample, new Sample(i + 1, 't', []))
    registry.handlers.push(() => registry.samples.length + sample.id)
    sum += registry.samples[1]!.total() + registry.handlers[0]!()
  }
  return sum
}

//! expect: first=9009000
console.log('first=' + churn())
//! expect: second=9009000
console.log('second=' + churn())
//! emitted-once: static constexpr bool gea_traceLeaf = true;
