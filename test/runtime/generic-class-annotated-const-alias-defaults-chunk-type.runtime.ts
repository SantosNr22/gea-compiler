//! expect: dynamic=first
//! expect: bytes=3
// A module re-exports a generic class under a constructor TYPE that defaults the type parameter
// differently (`const Alias: Ctor = Cls`, `Ctor`'s `R = unknown` against the class's own
// `R = Uint8Array`), the way `node:stream/web` re-exports the global stream class. A program that
// builds one through the alias and states no chunk type gets the alias's default, so a dynamic call
// through an `any` controller can hand it a string; the class itself, named directly, keeps its
// byte default. The alias holds the class's own constructor object: nothing converts a class
// constructor into the structural construct signature the annotation spells.
class Controller<R = Uint8Array> {
  private stream_: Stream<R>
  constructor(stream: Stream<R>) {
    this.stream_ = stream
  }
  push(chunk: R): void {
    this.stream_.add(chunk)
  }
}

class Stream<R = Uint8Array> {
  private queue_: R[] = []
  constructor(start?: (controller: Controller<R>) => void) {
    if (start !== undefined) start(new Controller<R>(this))
  }
  add(chunk: R): void {
    this.queue_.push(chunk)
  }
  first(): R {
    return this.queue_[0] as R
  }
}

type StreamConstructor = new <R = unknown>(start?: (controller: Controller<R>) => void) => Stream<R>
const StreamAlias: StreamConstructor = Stream
export { StreamAlias }

const dynamic = new StreamAlias((controller: any) => {
  controller.push('first')
})
console.log('dynamic=' + dynamic.first())
const bytes = new Stream((controller: Controller) => controller.push(new Uint8Array(3)))
console.log('bytes=' + bytes.first().length)
