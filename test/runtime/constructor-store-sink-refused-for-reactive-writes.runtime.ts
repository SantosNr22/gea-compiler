//! compile-only
//! emitted-lacks: this->command = std::move(gea_arg_0)

// A held-back constructor store is refused in a program with a reactive field: writing
// the field notifies its subscribers, and one of them may read the field the store has
// not reached yet. The store stays where it was written, as a copy.
import { Store } from '@geastack/core'

class Counter extends Store {
  count = 0
}

class Holder {
  command: Record<string, unknown>
  total: number
  constructor(command: Record<string, unknown>, counter: Counter) {
    this.command = command
    counter.count = (command.a as number) + 1
    this.total = (command.b as number) + counter.count
  }
}

const counter = new Counter()
const holder = new Holder({ a: 3, b: 4 }, counter)
console.log(holder.total)
