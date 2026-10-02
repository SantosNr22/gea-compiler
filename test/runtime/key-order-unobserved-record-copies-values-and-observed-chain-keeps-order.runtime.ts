// Creation order is bookkept only for records whose key order something can
// read (`ir/key-order-observation.ts`). `Quiet` is built out of layout order,
// spread and assigned, and never enumerated: its copies must still carry every
// value. `Source` is never enumerated itself but is spread and assigned into
// `Listed`, which `Object.keys` and `for-in` list, so the creation order of
// `Source` has to survive that copy.
type Quiet = { a?: number; b?: number; c?: number; d?: number; e?: number }
function quiet(): Quiet {
  const o: Quiet = { c: 1 }
  o.a = 2
  o.d = 3
  return o
}
const quietSpread: Quiet = { ...quiet(), e: 5 }
const quietAssigned = Object.assign({} as Quiet, quiet(), { b: 9 })
const quietTarget: Quiet = { e: 7 }
Object.assign(quietTarget, quiet())
console.log([quietSpread.a, quietSpread.c, quietSpread.d, quietSpread.e].join(','))
console.log([quietAssigned.a, quietAssigned.b, quietAssigned.c, quietAssigned.d].join(','))
console.log([quietTarget.a, quietTarget.c, quietTarget.d, quietTarget.e].join(','))

type Source = { z?: number; y?: number; x?: number }
type Listed = { x?: number; y?: number; z?: number; w?: number }
function source(): Source {
  const s: Source = { x: 1 }
  s.z = 3
  s.y = 2
  return s
}
const spreadListed: Listed = { ...source(), w: 4 }
console.log(Object.keys(spreadListed).join(','))
const assignedListed: Listed = Object.assign({} as Listed, source())
console.log(Object.keys(assignedListed).join(','))
const forInKeys: string[] = []
for (const key in spreadListed) forInKeys.push(key)
console.log(forInKeys.join(','))
//! expect: 2,1,3,5
//! expect: 2,9,1,3
//! expect: 2,1,3,7
//! expect: x,z,y,w
//! expect: x,z,y
//! expect: x,z,y,w
