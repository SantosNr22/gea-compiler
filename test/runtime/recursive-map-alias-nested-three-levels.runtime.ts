// A recursive alias `Tree = Map<string, Tree>` is one native map type at every
// depth: the carrier must not cut the recursion into a record of `Map`'s
// interface members, or a map stored three levels down has no carrier.
type Tree = Map<string, Tree>

const root: Tree = new Map()
root.set('a', new Map())
root.get('a')?.set('b', new Map())
root.get('a')?.get('b')?.set('c', new Map())
root.get('a')?.get('b')?.get('c')?.set('d', new Map())

const depth = (tree: Tree): number => {
  let deepest = 0
  for (const child of tree.values()) deepest = Math.max(deepest, depth(child))
  return deepest + 1
}
console.log(depth(root), root.get('a')?.get('b')?.get('c')?.has('d'))
//! expect: 5 true
