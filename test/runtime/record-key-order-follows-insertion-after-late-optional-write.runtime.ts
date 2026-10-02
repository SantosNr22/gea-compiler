// ECMA-262 10.1.11 OrdinaryOwnPropertyKeys lists string keys in creation
// order. A native record declares its fields in one fixed order, so an
// optional field absent at construction and written later must still
// enumerate after every key that already existed -- through JSON.stringify,
// Object.keys, for-in, Object.entries and a spread alike.
interface Wide {
  id: number
  s1?: string
  s3?: string
  s17?: string
  n2?: number
}

const parsed = JSON.parse('{"id":7,"s3":"three","s17":"seventeen","n2":2}') as Wide
parsed.s1 = 'one'
console.log('A', JSON.stringify(parsed))
console.log('B', Object.keys(parsed).join(','))

const o: Wide = { id: 1 }
o.s17 = 'x'
o.s1 = 'y'
console.log('C', JSON.stringify(o), Object.keys(o).join(','))
const keys: string[] = []
for (const k in o) keys.push(k)
console.log(
  'D',
  keys.join(','),
  Object.entries(o)
    .map(([k, v]) => k + '=' + v)
    .join(',')
)

const s: Wide = { ...o, s3: 'z' }
console.log('E', JSON.stringify(s))

const lit: Wide = { s3: 'a', id: 2 }
console.log('F', JSON.stringify(lit), Object.keys(lit).join(','))

delete o.s17
o.s17 = 'again'
console.log('G', Object.keys(o).join(','))

const doc = JSON.parse('{"n2":1,"s3":"b","id":3}') as Wide
console.log('H', JSON.stringify(doc), Object.keys(doc).join(','))

const assigned: Wide = { id: 4, s17: 'q' }
Object.assign(assigned, { s1: 'w' })
console.log('I', Object.keys(assigned).join(','))

const inner: Wide = { id: 5, s17: 'r' }
const after: Wide = { ...inner, s3: 't' }
console.log('J', Object.keys(after).join(','))

const before: Wide = { s17: 'p', ...{ id: 9 } }
console.log('K', Object.keys(before).join(','), JSON.stringify(before))

const overwritten: Wide = { ...inner, id: 6 }
const lacking: Wide = { ...{ s17: 'u' }, id: 3 }
console.log('L', Object.keys(overwritten).join(','), Object.keys(lacking).join(','))

//! expect: A {"id":7,"s3":"three","s17":"seventeen","n2":2,"s1":"one"}
//! expect: B id,s3,s17,n2,s1
//! expect: C {"id":1,"s17":"x","s1":"y"} id,s17,s1
//! expect: D id,s17,s1 id=1,s17=x,s1=y
//! expect: E {"id":1,"s17":"x","s1":"y","s3":"z"}
//! expect: F {"s3":"a","id":2} s3,id
//! expect: G id,s1,s17
//! expect: H {"n2":1,"s3":"b","id":3} n2,s3,id
//! expect: I id,s17,s1
//! expect: J id,s17,s3
//! expect: K s17,id {"s17":"p","id":9}
//! expect: L id,s17 s17,id
