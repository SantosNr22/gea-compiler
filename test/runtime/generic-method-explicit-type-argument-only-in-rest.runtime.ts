// A generic method whose type parameter appears only inside its rest
// parameter's `Parameters<E[K]>`, called with the type argument written
// out: `emitter.emit<'started'>(event)`. Nothing in the argument list names
// `K`, so the call's copy is chosen by the explicit argument alone -- and it
// must exist, not be read off the instance as a dynamic property.
class Started {
  constructor(readonly id: string) {}
}
class Failed {
  constructor(
    readonly id: string,
    readonly duration: number
  ) {}
}
type Events = {
  started(event: Started): void
  failed(event: Failed): void
}
class Emitter<E extends Record<string, (...args: any[]) => void>> {
  seen: string[] = []
  emit<K extends keyof E>(...args: Parameters<E[K]>): void {
    this.seen.push(`${args.length}`)
  }
}
const emitter = new Emitter<Events>()
emitter.emit<'started'>(new Started('a'))
emitter.emit<'failed'>(new Failed('b', 5))
console.log(emitter.seen.join(' '))
//! expect: 1 1
