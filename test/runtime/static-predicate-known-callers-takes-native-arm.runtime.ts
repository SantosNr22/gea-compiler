// A private static type predicate whose only callers are in the class is a
// plain native call: the argument keeps its static union (no gea::Value box)
// and no callable object is built per call. bson's `ObjectId.is(inputId)`.
interface IdLike {
  id: string | Uint8Array
}
class Ident {
  tag = 'Ident'
  _bsontype = 'ObjectId'
  constructor(input?: string | Ident | IdLike) {
    if (typeof input === 'object' && input && 'id' in input) {
      if (Ident.is(input)) {
        this.tag = 'same'
        return
      }
      this.tag = 'like'
      return
    }
    this.tag = typeof input === 'string' ? 'string' : 'none'
  }
  private static is(variable: unknown): variable is Ident {
    return variable != null && typeof variable === 'object' && '_bsontype' in variable && variable._bsontype === 'ObjectId'
  }
}
const same = new Ident()
;(same as unknown as { id: string }).id = 'x'
console.log(new Ident().tag, new Ident('a').tag, new Ident({ id: 'b' }).tag, new Ident(same as unknown as IdLike).tag)

//! expect: none string like same
//! emitted-lacks: gea::Value v
//! emitted-lacks: CallableObject<bool(gea::Value)>
