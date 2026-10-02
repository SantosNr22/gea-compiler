function capture(input: Float32Array, output: Int16Array, source: number, target: number, count: number): void {
  for (let index = 0; index < count; index++) {
    let sample = input[source + index] || 0
    if (sample > 1) sample = 1
    else if (sample < -1) sample = -1
    output[target + index] = Math.round(sample * (sample < 0 ? 32768 : 32767))
  }
}

const input = new Float32Array([-2, -1, -0.5, 0, 0.5, 1, 2, NaN])
const output = new Int16Array(input.length)
capture(input, output, 0, 0, input.length)
console.log(output.toString())
