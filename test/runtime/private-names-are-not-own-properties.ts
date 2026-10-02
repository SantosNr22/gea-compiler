// A `#name` is a PrivateElement held in the object's [[PrivateElements]],
// not a property: JSON.stringify, Object.keys, for-in and object spread never
// see it. A TypeScript `private` field is an ordinary own property -- the
// modifier is a compile-time check only -- so all four see it.

class Account {
  #pin = 1234
  private owner = 'ann'
  balance = 10
  protected tier = 'gold'
  pin(): number {
    return this.#pin
  }
}

const account = new Account()
//! expect: A {"owner":"ann","balance":10,"tier":"gold"}
console.log('A', JSON.stringify(account))
//! expect: B owner,balance,tier
console.log('B', Object.keys(account).join(','))
const seen: string[] = []
for (const key in account) seen.push(key)
//! expect: C owner,balance,tier
console.log('C', seen.join(','))
const spread = { ...account }
//! expect: D {"owner":"ann","balance":10,"tier":"gold"}
console.log('D', JSON.stringify(spread))
//! expect: E owner,balance,tier
console.log('E', Object.keys(spread).join(','))
//! expect: F 1234
console.log('F', account.pin())

// `loose['#pin']` asks for the STRING key "#pin", which this object does not
// have. The element access resolves to the same key text a private name is
// laid out under, so the static read finds the private element.
const loose = account as any
//! expect: G undefined
console.log('G', loose['#pin'])
//! expect: H owner,balance,tier
console.log('H', Object.keys(loose).join(','))

// A class may hold BOTH a private `#pin` and a real string property '#pin'.
// They are two members; each access finds its own value.
class Both {
  #pin = 1
  '#pin' = 2
  readPrivate(): number {
    return this.#pin
  }
}
const both = new Both()
//! expect: I 1
console.log('I', both.readPrivate())
//! expect: J 2
console.log('J', both['#pin'])
//! expect: K {"#pin":2}
console.log('K', JSON.stringify(both))
//! expect: L #pin
console.log('L', Object.keys(both).join(','))
