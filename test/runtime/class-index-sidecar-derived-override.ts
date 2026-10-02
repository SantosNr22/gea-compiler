// A derived class with an index signature under a base that has none. The
// derived struct states `gea_writeOwnIndexNative` for its sidecar's value type,
// a member its base never declared, and it was marked `override` all the same
// ("only virtual member functions can be marked 'override'"). A member is an
// override only when the base chain declared that exact signature.
//! expect: keys:name,extra,k,j
//! expect: values:b|x|v|w
//! expect: json:{"name":"b","extra":"x","k":"v","j":"w"}
class Base {
  name = 'b'
}
class Derived extends Base {
  [key: string]: string
  extra = 'x'
}
const d = new Derived()
d['k'] = 'v'
const key = 'j'
d[key] = 'w'
console.log('keys:' + Object.keys(d).join(','))
console.log('values:' + [d.name, d.extra, d['k'], d[key]].join('|'))
console.log('json:' + JSON.stringify(d))
