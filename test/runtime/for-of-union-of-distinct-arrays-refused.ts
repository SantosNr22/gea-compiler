// The sibling of `for-of-union-of-node-arrays.ts` whose two arrays' element
// layouts do NOT agree (`Point` and `Label` share no interface family), so the
// union stays a tagged union. A sum of Arrays has a native cursor all the same
// (`publish.ts`'s `nativeCursorIteratorOf`, `emit-iterator.ts`'s
// `emitSequenceSumIterator`): whichever arm is live walks by its own index/length
// cursor and each arm's element widens into the iterator's declared element, the
// union `Point | Label`. This used to refuse at `get-iterator:tagged-union`
// (hence the file name); the per-arm walk is the native path
// `seeds: string[] | HostAddress[]` takes, with no box and no dynamic view.
interface Point {
  x: number
  y: number
}
interface Label {
  text: string
}
interface NodeArray<T> extends ReadonlyArray<T> {
  readonly pos: number
}
interface MutableNodeArray<T> extends Array<T> {
  pos: number
}
type Holder = { kind: 'points'; items: NodeArray<Point> } | { kind: 'labels'; items: NodeArray<Label> }
function createNodeArray<T>(elements: readonly T[], pos: number): NodeArray<T> {
  const array = elements.slice() as MutableNodeArray<T>
  array.pos = pos
  return array
}
function count(holder: Holder): number {
  let n = 0
  for (const item of holder.items) {
    if (item) n++
  }
  return n
}
const points: Holder = { kind: 'points', items: createNodeArray<Point>([{ x: 1, y: 2 }], 0) }
const labels: Holder = { kind: 'labels', items: createNodeArray<Label>([{ text: 'a' }, { text: 'b' }], 0) }
//! expect: 1 2
console.log(count(points), count(labels))
