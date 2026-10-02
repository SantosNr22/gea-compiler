// A constructor carried by its construct ABI alone -- a record field typed
// with a construct signature -- still is a function object with properties:
// its class's statics (mongodb-client-encryption's
// `mc.MongoCrypt.libmongocryptVersion`), its real prototype object (bson's
// `Buffer.prototype?._isBuffer`), and `undefined` for a key nothing
// declares.

// The slot's `new` answers `unknown`, so the class's instance crosses into it
// boxed -- a genuine dynamic boundary. A slot answering a structural interface
// would need the class instance viewed as that record, which is not installed
// and refuses at certification rather than slicing the instance into a copy.
interface MongoCryptConstructor {
  new (options: { tag: string }): unknown
  libmongocryptVersion: string
  missing?: string
}

class NativeMongoCrypt {
  static libmongocryptVersion = '1.8.4'
  tag: string
  constructor(options: { tag: string }) {
    this.tag = options.tag
  }
  describe(): string {
    return `crypt:${this.tag}`
  }
}

const bindings: { MongoCrypt: MongoCryptConstructor } = { MongoCrypt: NativeMongoCrypt }

class MongoCrypt {
  static readonly libmongocryptVersion: string = bindings.MongoCrypt.libmongocryptVersion
}

console.log(MongoCrypt.libmongocryptVersion, typeof new bindings.MongoCrypt({ tag: 'x' }), bindings.MongoCrypt.missing === undefined)

interface BufferLike {
  new (options: { tag: string }): unknown
  prototype?: { describe?: unknown; _isBuffer?: boolean }
}

const holder: { Buffer: BufferLike } = { Buffer: NativeMongoCrypt }
const proto = holder.Buffer.prototype
console.log(typeof proto, typeof proto?.describe, proto?._isBuffer !== true)

//! expect: 1.8.4 object true
//! expect: object function true
