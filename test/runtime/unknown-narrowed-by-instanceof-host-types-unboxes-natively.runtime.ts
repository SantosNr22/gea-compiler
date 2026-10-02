// More native host types behind an `unknown`: each `instanceof` guard
// narrows the value to its own native carrier -- an Error subclass, a typed
// array, a DataView, an ArrayBuffer -- so the member reads in the branch are
// static, and writes through the narrowed typed array and DataView land in
// the originals. A local `unknown` narrows the same way a parameter does.
function inspect(value: unknown): string {
  if (value instanceof TypeError) return `type-error ${value.name} ${value.message}`
  if (value instanceof Error) return `error ${value.name} ${value.message}`
  if (value instanceof Uint8Array) {
    value[0] = 9
    return `bytes ${value.length} ${value.byteLength} ${value[0]}`
  }
  if (value instanceof DataView) {
    value.setUint8(1, 7)
    return `view ${value.byteLength} ${value.getUint8(1)}`
  }
  if (value instanceof ArrayBuffer) return `buffer ${value.byteLength} ${value.slice(1).byteLength}`
  return 'other'
}
const bytes = new Uint8Array(3)
const raw = new ArrayBuffer(4)
const view = new DataView(new ArrayBuffer(2))
const held: unknown[] = []
held.push(new TypeError('bad type'))
held.push(new RangeError('out of range'))
held.push(bytes)
held.push(view)
held.push(raw)
held.push(1)
for (const value of held) console.log(inspect(value))
console.log(`originals ${bytes[0]} ${view.getUint8(1)}`)
const local: unknown = held[2]
if (local instanceof Uint8Array) console.log(`local ${local.length} ${local[0]}`)
//! expect: type-error TypeError bad type
//! expect: error RangeError out of range
//! expect: bytes 3 3 9
//! expect: view 2 7
//! expect: buffer 4 3
//! expect: other
//! expect: originals 9 7
//! expect: local 3 9
//! emitted-lacks: getProperty(gea::PropertyKey::string("message")
//! emitted-lacks: getProperty(gea::PropertyKey::string("byteLength")
//! emitted-lacks: getProperty(gea::PropertyKey::string("setUint8")
export {}
