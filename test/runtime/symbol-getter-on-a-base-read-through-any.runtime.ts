//! expect: Binary 7 Binary
//! expect: Long 7 Long
//! expect: plain undefined

// bson's serializer: every BSON value class extends `BSONValue`, whose
// symbol-keyed getters `[BSON_VERSION_SYMBOL]` and `[bsonType]` answer for
// every subclass. The serializer reads them off an `any` document value
// (`value[constants.BSON_VERSION_SYMBOL] !== constants.BSON_MAJOR_VERSION`),
// so the dynamic read has to find a getter the BASE declares under a
// registered-symbol key.

const BSON_VERSION_SYMBOL = Symbol.for('@@mdb.bson.version')
const bsonType = Symbol.for('@@mdb.bson.type')
const BSON_MAJOR_VERSION = 7 as const

abstract class BSONValue {
  abstract get _bsontype(): string
  get [bsonType](): this['_bsontype'] {
    return this._bsontype
  }
  get [BSON_VERSION_SYMBOL](): typeof BSON_MAJOR_VERSION {
    return BSON_MAJOR_VERSION
  }
}

class Binary extends BSONValue {
  get _bsontype(): 'Binary' {
    return 'Binary'
  }
  bytes: number[]
  constructor(bytes: number[]) {
    super()
    this.bytes = bytes
  }
}

class Long extends BSONValue {
  get _bsontype(): 'Long' {
    return 'Long'
  }
  high = 0
  low = 1
}

function describe(value: any): string {
  if (value._bsontype == null) return 'plain ' + String(value[BSON_VERSION_SYMBOL])
  return value._bsontype + ' ' + String(value[Symbol.for('@@mdb.bson.version')]) + ' ' + String(value[bsonType])
}

const doc: Record<string, unknown> = { id: new Binary([1, 2]), n: new Long(), p: { a: 1 } }
for (const key of Object.keys(doc)) console.log(describe(doc[key]))
