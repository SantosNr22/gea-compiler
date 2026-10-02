// A generic method's parameter, instantiated at a UNION of two sibling
// classes, asserted to an interface both of them implement: node-compat's
// `pipeline()` narrows each destination to `Writable | Duplex` and hands it
// to `Readable.pipe<T>`, whose body views its `T` as the write surface
// (`destination as unknown as PipeDestination`). Every arm of the union is a
// class that has that surface, so the view is each arm's own -- selected by
// the value's tag, keeping the object's identity for every call made on it.
interface Destination {
  write(chunk: unknown): boolean
  end?(): unknown
  once(name: string, listener: (...args: unknown[]) => void): unknown
  emit(name: string, ...args: unknown[]): boolean
}

class Emitter {
  readonly listeners: string[] = []
  once(name: string, _listener: (...args: unknown[]) => void): unknown {
    this.listeners.push(name)
    return this
  }
  emit(name: string, ...args: unknown[]): boolean {
    this.listeners.push(name + ':' + args.length)
    return true
  }
}

class Sink extends Emitter {
  readonly chunks: unknown[] = []
  write(chunk: unknown): boolean {
    this.chunks.push(chunk)
    return true
  }
  end(): unknown {
    this.chunks.push('<end>')
    return this
  }
}

class Channel extends Emitter {
  count = 0
  write(_chunk: unknown): boolean {
    this.count += 1
    return this.count < 2
  }
  end(): unknown {
    return this
  }
}

class Source extends Emitter {
  pipe<T>(destination: T, chunks: readonly string[]): T {
    const target = destination as unknown as Destination
    for (const chunk of chunks) {
      if (target.write(chunk) === false) target.once('drain', () => {})
    }
    if (typeof target.end === 'function') target.end()
    target.emit('pipe', this)
    return destination
  }
}

const connect = (streams: Emitter[]): number => {
  let piped = 0
  for (let index = streams.length - 2; index >= 0; index--) {
    const source = streams[index]
    const destination = streams[index + 1]
    if (!(source instanceof Source)) continue
    if (!(destination instanceof Sink) && !(destination instanceof Channel)) throw new Error('not writable')
    source.pipe(destination, ['a', 'b'])
    piped += 1
  }
  return piped
}

const sink = new Sink()
const channel = new Channel()
console.log('piped=' + connect([new Source(), sink]) + ',' + connect([new Source(), channel]))
console.log('sink=' + sink.chunks.join('|') + ' channel=' + channel.count + ' drains=' + channel.listeners.join('|'))
try {
  connect([new Source(), new Source()])
} catch (error) {
  console.log('caught=' + (error as Error).message)
}
//! expect: piped=1,1
//! expect: sink=a|b|<end> channel=2 drains=drain|pipe:1
//! expect: caught=not writable
export {}
