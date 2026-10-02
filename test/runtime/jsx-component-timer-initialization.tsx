//! compile-only
//! emitted-has: gea::host::setTimeout
import { ReactiveComponent } from '@geastack/core'

class Counter extends ReactiveComponent {
  count = 0
  timer = setTimeout(() => {
    this.count += 1
  }, 0)
  constructor() {
    super()
    this.count = 1
  }
  onAfterRender() {
    this.count += 1
  }
  template(): JSX.Element {
    return <div>{this.count}</div>
  }
}
const tree = <Counter />
void tree
