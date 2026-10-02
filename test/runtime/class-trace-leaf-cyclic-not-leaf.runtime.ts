// Classes on a type cycle (a self reference, or two classes naming each other)
// are not leaves, and the garbage they form is still collected while live
// instances read back correctly.
class Link {
  v: number
  next: Link | null = null
  constructor(v: number) {
    this.v = v
  }
}

class Left {
  right: Right | null = null
  n = 1
}

class Right {
  left: Left | null = null
  m = 2
}

function churn(): number {
  let sum = 0
  for (let i = 0; i < 3000; i++) {
    const a = new Link(i)
    const b = new Link(i + 1)
    a.next = b
    b.next = a
    const l = new Left()
    const r = new Right()
    l.right = r
    r.left = l
    sum += a.next!.next!.v + l.right!.left!.n + r.m
  }
  return sum
}

//! expect: first=4507500
console.log('first=' + churn())
//! expect: second=4507500
console.log('second=' + churn())
//! emitted-lacks: gea_traceLeaf
