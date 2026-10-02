// A class with a descendant is never a leaf: a `Ref<Shape>` may hold a Circle.
// The derived class is, because the whole hierarchy is evaluated once and
// nothing derives from it, so exactly one struct carries the marker.
class Shape {
  name: string
  constructor(name: string) {
    this.name = name
  }
  area(): number {
    return 0
  }
}

class Circle extends Shape {
  radius: number
  constructor(radius: number) {
    super('circle')
    this.radius = radius
  }
  area(): number {
    return 3 * this.radius * this.radius
  }
}

function churn(): number {
  let sum = 0
  for (let i = 0; i < 3000; i++) {
    const shapes: Shape[] = [new Shape('plain'), new Circle(i % 7)]
    sum += shapes[0]!.area() + shapes[1]!.area() + shapes[1]!.name.length
  }
  return sum
}

//! expect: first=134886
console.log('first=' + churn())
//! expect: second=134886
console.log('second=' + churn())
//! emitted-once: static constexpr bool gea_traceLeaf = true;
