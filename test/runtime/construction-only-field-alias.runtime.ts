// A field written only while constructing its object is read in place by
// methods; a field reassigned later, a constructor-time read, an async read
// across an await while the constructor keeps writing, and a subclass
// constructor writing a base field must all still see the right value.
class Socket {
  constructor(readonly name: string) {}
}
class Connection {
  socket: Socket
  label: string
  swapped: Socket
  seenInConstructor: string
  constructor(name: string) {
    this.socket = new Socket(name)
    this.label = 'first'
    this.seenInConstructor = this.describe()
    this.swapped = this.socket
    void this.watch()
    this.label = 'second'
  }
  describe(): string {
    const socket = this.socket
    const label = this.label
    return socket.name + '/' + label + '/' + socket.name.length
  }
  swap(next: Socket): string {
    const before = this.swapped
    this.swapped = next
    return before.name + '>' + this.swapped.name
  }
  // The read is followed by a call before its use, so it cannot be deferred
  // to its use; the call even mutates this object's other fields.
  pair(): string {
    return join(this.socket, this.bump(), this.socket)
  }
  bump(): number {
    this.swapped = new Socket('bumped')
    return this.label.length
  }
  async watch(): Promise<void> {
    const label = this.label
    await null
    log.push('watch:' + label + '->' + this.label)
  }
}
class Pooled extends Connection {
  constructor() {
    super('pooled')
    this.label = 'pooled-label'
  }
}
const join = (left: Socket, middle: number, right: Socket): string => left.name + middle + right.name
const log: string[] = []
const connection = new Connection('alpha')
const pooled = new Pooled()
console.log(connection.seenInConstructor, connection.describe(), pooled.describe(), connection.swap(new Socket('beta')), connection.pair())
void Promise.resolve().then(() => console.log(log.join(' ')))

//! expect: alpha/first/5 alpha/second/5 pooled/pooled-label/6 alpha>beta alpha6alpha
//! expect: watch:first->second watch:first->pooled-label
