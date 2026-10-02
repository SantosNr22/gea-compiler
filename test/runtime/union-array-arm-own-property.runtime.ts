// An ordinary own property read off the ARRAY arm of a union -- bson's
// `internalCalculateObjectSize` reads `(obj as any)?.toBSON` off a `Document`
// that may view an array. `toBSON` is no Array.prototype name, so an array
// answers it from its own properties (the shared expando table), which hold
// none here: `undefined`.
type Doc = unknown[] | { toBSON?: () => string; v: number }

function describe(obj: Doc): string {
  const isArray = Array.isArray(obj)
  if (typeof (obj as any)?.toBSON === 'function') return `custom:${(obj as any).toBSON()}`
  return isArray ? 'array' : 'plain'
}
const plainArray: unknown[] = []
plainArray.push('x')
console.log(describe(plainArray), describe({ v: 1 }), describe({ v: 2, toBSON: () => 'from-record' }))
//! expect: array plain custom:from-record
