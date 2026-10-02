// A method (a body with a receiver) gets the same integer version as a free
// function: bson's ObjectId.serializeInto(buffer, index) writes twelve bytes at
// `index + k`, and `index` arrives from a value the census cannot see into.
// The receiver is forwarded unchanged into the `_integral` body.
//! expect: 1,2,3,4,5,6,7,8,9,10,11,12 12
//! expect: 0.5 11.5 12.5 true
//! emitted-has: gea::carriesExactInteger(
//! emitted-has: _integral(

class Writer {
  bytes = new Uint8Array(16)

  put(index: number): number {
    this.bytes[index] = 1
    this.bytes[index + 1] = 2
    this.bytes[index + 2] = 3
    this.bytes[index + 3] = 4
    this.bytes[index + 4] = 5
    this.bytes[index + 5] = 6
    this.bytes[index + 6] = 7
    this.bytes[index + 7] = 8
    this.bytes[index + 8] = 9
    this.bytes[index + 9] = 10
    this.bytes[index + 10] = 11
    this.bytes[index + 11] = 12
    return index + 12
  }

  span(index: number): string {
    const a = index + 11
    const b = index + 12
    return `${index} ${a} ${b}`
  }
}

const options = JSON.parse('{"index": 0, "fraction": 0.5}') as { index: number; fraction: number }
const writer = new Writer()
const end = writer.put(options.index)
console.log(Array.from(writer.bytes.slice(0, 12)).join(','), end)
const fractional = writer.span(options.fraction)
console.log(fractional, writer.put(options.fraction) === 12.5)
