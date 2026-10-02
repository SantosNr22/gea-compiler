// A record viewed into a wider shape reads the keys it grew after allocation
// from its sidecar: the view's cold out-of-line path, not the common one.
interface Narrow {
  name: string
}
interface Wide {
  name: string
  level?: number
  label?: string
}
const describe = (wide: Wide): string => wide.name + ':' + (wide.level ?? -1) + ':' + (wide.label ?? '-')
const plain: Narrow = { name: 'plain' }
const grown: Narrow = { name: 'grown' }
;(grown as any).level = 7
;(grown as any).label = 'x'
console.log(describe(plain), describe(grown), describe(plain))

//! expect: plain:-1:- grown:7:x plain:-1:-
