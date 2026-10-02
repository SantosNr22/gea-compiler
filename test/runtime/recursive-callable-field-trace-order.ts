// A record field whose carrier is a recursive callable wrapper: `Step`
// returns a record that holds a `Step`. The record's trace hook asks
// `TraceEdges<wrapper>::supported` inside its own definition, which
// instantiated the primary template before the wrapper's specialization was
// declared further down ("explicit specialization ... after instantiation").
// The specialization's class half now precedes every program struct.
//! expect: steps:a>b>c
//! expect: count:3
type Step = (input: string) => Promise<{ text: string; count: number; step: Step }>

const makeStep =
  (prefix: string, count: number): Step =>
  async (input: string) => {
    const text = prefix === '' ? input : prefix + '>' + input
    return { text, count: count + 1, step: makeStep(text, count + 1) }
  }

async function main(): Promise<void> {
  const first = await makeStep('', 0)('a')
  const second = await first.step('b')
  const third = await second.step('c')
  console.log('steps:' + third.text)
  console.log('count:' + third.count)
}
void main()
