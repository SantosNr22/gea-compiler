// An `extends`-connected interface family shares ONE physical layout across
// every member (`semantics/interface-families.ts`), so `sparseLayoutFieldsOf`
// (records.ts) sees the union of every member's fields when it decides
// whether the shared struct crosses the sparse-layout threshold, and
// `tailFieldsOf` the same union when it decides which of those (the
// `string`-payload ones) move behind `gea::RecordTail`. This program is the
// family case: writing a TAIL field (`b5`, a string) through a BASE-typed
// view of a derived object, and reading/writing a TAIL field through a
// computed (dynamic) key -- the dynamic dispatcher's `RecordTail::ensure()`
// call resolving to its `const` (assume-allocated) overload for the read and
// its non-`const` (lazily-allocating) overload for the write.
interface BaseBig {
  b1?: string
  b2?: string
  b3?: string
  b4?: string
  b5?: string
  b6?: string
  b7?: string
  b8?: string
  b9?: string
  b10?: string
  b11?: number
  b12?: number
  b13?: number
  b14?: number
  b15?: number
  b16?: number
  b17?: number
  b18?: number
  b19?: number
  b20?: number
  b21?: boolean
  b22?: boolean
  b23?: boolean
  b24?: boolean
  b25?: boolean
  b26?: boolean
  b27?: boolean
  b28?: boolean
  b29?: boolean
  b30?: boolean
  tag?: string
}
interface DerivedBig extends BaseBig {
  id: number
  extra1?: string
  extra2?: number
  extra3?: string
}

// Writes a field through a BASE-typed parameter -- a view over whatever
// concrete family member is actually passed.
function stampBase(target: BaseBig, value: string): void {
  target.tag = value
  target.b5 = 'set-through-base'
}

const derived: DerivedBig = { id: 7, extra1: 'x', b11: 3 }
stampBase(derived, 'stamped')
console.log('base-view:', derived.tag, derived.b5, derived.id, derived.extra1, derived.b11)

// A key only known at runtime -- read and written through the dynamic
// property protocol rather than a statically-known field access. Both keys
// name TAIL fields (`b2`, `extra3`: string-payload optionals), so the
// generic dispatcher's `RecordTail::ensure()` call is reached through the
// `const`/non-`const` overloads a computed key's read/write take.
const readKey: string = ['b', '2'].join('')
const writeKey: string = ['ex', 'tra', '3'].join('')
const bag = derived as unknown as Record<string, unknown>
console.log('dynamic-read-absent:', bag[readKey])
bag[writeKey] = 'dynamic-set'
console.log('dynamic-write:', derived.extra3, bag[writeKey])
console.log('dynamic-read-typed-field:', bag['id'], bag['tag'])

//! expect: base-view: stamped set-through-base 7 x 3
//! expect: dynamic-read-absent: undefined
//! expect: dynamic-write: dynamic-set dynamic-set
//! expect: dynamic-read-typed-field: 7 stamped
//! emitted-has: gea::RecordTail<
export {}
