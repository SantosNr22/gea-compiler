// A two-member recursion group (`sweep` calls `notify` back into `off`, `notify`
// calls `sweep`) where only ONE member's identity is ever asked for: `notify`
// is registered and later removed BY HANDLE (`Bus.off`'s `indexOf` scan reads
// its identity), but `sweep` is only ever called by name -- once from inside
// the group, once through a plain closure that merely stores a COPY of it. Per
// `ir/callable-identity-demand.ts`, `sweep`'s convention is never observed, so
// the group's frame (`translation-unit.ts`'s `frameDeclarationOf`) reserves an
// identity header for `notify` alone: `gea_identity_0`, and no
// `gea_identity_1` for `sweep`. Calling `sweep` through the stored copy must
// still mutate the exact state `notify` shares.
'use strict'
class Bus {
  private handlers: Array<(n: number) => void> = []
  on(handler: (n: number) => void): void {
    this.handlers.push(handler)
  }
  off(handler: (n: number) => void): void {
    const index = this.handlers.indexOf(handler)
    if (index >= 0) this.handlers.splice(index, 1)
  }
  fire(n: number): void {
    for (const handler of this.handlers.slice()) handler(n)
  }
}
function session(bus: Bus, label: string): { stored: () => number; report(): string } {
  let total = 0
  let rounds = 0
  bus.on(notify)
  const stored = sweep
  return {
    stored,
    report(): string {
      return label + ':' + total + '/' + rounds
    }
  }
  function notify(n: number): void {
    total += n
    if (total > 100) sweep()
  }
  function sweep(): number {
    bus.off(notify)
    rounds += 1
    total = 0
    return rounds
  }
}
const bus = new Bus()
const s1 = session(bus, 'a')
bus.fire(10)
bus.fire(5)
console.log(s1.report())
console.log(s1.stored())
console.log(s1.report())
bus.fire(999)
console.log(s1.report())
//! expect: a:15/0
//! expect: 1
//! expect: a:0/1
//! expect: a:0/1
//! emitted-has: gea_identity_0
//! emitted-lacks: gea_identity_1
