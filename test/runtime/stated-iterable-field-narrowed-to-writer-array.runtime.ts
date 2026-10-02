// A record field stated as returning the `Iterable<T>` protocol whose one
// writer is a function that really returns `T[]` (bson's
// `onDemand.parseToElements`). The caller probes `Array.isArray` on the
// result, so the array must arrive as an array, not wrapped in an iterable.

type BsonElement = [type: number, offset: number, length: number]

function parseToElements(bytes: Uint8Array, startOffset: number | null = 0): Iterable<BsonElement> {
  startOffset ??= 0
  const elements: BsonElement[] = []
  for (let i = startOffset; i < bytes.length; i++) elements.push([bytes[i]!, i, 1])
  return elements
}

type OnDemand = {
  parseToElements: (this: void, bytes: Uint8Array, startOffset?: number) => Iterable<BsonElement>
}

const onDemand: OnDemand = Object.create(null)
onDemand.parseToElements = parseToElements
Object.freeze(onDemand)

function parseToElementsToArray(bytes: Uint8Array, offset?: number): BsonElement[] {
  const res = onDemand.parseToElements(bytes, offset)
  return Array.isArray(res) ? res : [...res]
}

const all = parseToElementsToArray(new Uint8Array([7, 8, 9]))
console.log(all.length, all.map((e) => e.join(':')).join(','))
const tail = parseToElementsToArray(new Uint8Array([7, 8, 9]), 2)
console.log(tail.length, tail[0]![0], Array.isArray(onDemand.parseToElements(new Uint8Array([1]))))

//! expect: 3 7:0:1,8:1:1,9:2:1
//! expect: 1 9 true
