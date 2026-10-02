//! expect: bytes=3
//! expect: alias=hello
//! expect: pipe=world
// `const Alias = Stream` over a generic class, with EVERY construction of it going through the alias
// and a second instantiation (`Stream<unknown>`) reached only inside another class. A read of the bare
// class name has no cell; the alias stores the first copy's cell, which is what the construct through
// the alias runs. That cell must therefore survive the unreferenced-cell shake and keep its
// initialization, or the program either fails to compile (undeclared global) or calls a null
// constructor.
class Controller<R = Uint8Array> {
  private stream_: Stream<R>
  constructor(stream: Stream<R>) {
    this.stream_ = stream
  }
  push(chunk: R): void {
    this.stream_.items.push(chunk)
  }
}

class Stream<R = Uint8Array> {
  items: R[] = []
  constructor(start?: (controller: Controller<R>) => void) {
    if (start !== undefined) start(new Controller<R>(this))
  }
  first(): R {
    return this.items[0] as R
  }
}

class Pipe {
  out: Stream<unknown>
  constructor() {
    this.out = new Stream<unknown>()
  }
}

const StreamAlias = Stream
export { StreamAlias }

const bytes = new StreamAlias((c: Controller) => c.push(new Uint8Array(3)))
console.log('bytes=' + bytes.first().length)
const viaAlias = new StreamAlias<unknown>()
viaAlias.items.push('hello')
console.log('alias=' + viaAlias.first())
const pipe = new Pipe()
pipe.out.items.push('world')
console.log('pipe=' + pipe.out.first())
