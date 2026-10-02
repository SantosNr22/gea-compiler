//! expect: string left 3
//! expect: string right kept
//! expect: number first 4
//! expect: number second done
//! expect: missing-field true
//! expect: native right native
//! expect: matching-layout second 8

type TextResult = { kind: 'left'; count: number } | { kind: 'right'; text: string }
function textResult(source: string): void {
  const parsed: unknown = JSON.parse(source)
  const result = parsed as TextResult
  if (result.kind === 'left') console.log('string', result.kind, result.count)
  else console.log('string', result.kind, result.text)
}
type NumberResult = { code: 1; count: number } | { code: 2; text: string }
function numberResult(source: string): void {
  const parsed: unknown = JSON.parse(source)
  const result = parsed as NumberResult
  if (result.code === 1) console.log('number', 'first', result.count)
  else console.log('number', 'second', result.text)
}
textResult('{"kind":"left","count":3}')
textResult('{"kind":"right","text":"kept"}')
numberResult('{"code":1,"count":4}')
numberResult('{"code":2,"text":"done"}')
try {
  textResult('{"kind":"left"}')
} catch (error) {
  console.log('missing-field', error instanceof TypeError)
}

const native: TextResult = { kind: 'right', text: 'native' }
const boundary: unknown = native
const restored = boundary as TextResult
if (restored.kind === 'right') console.log('native', restored.kind, restored.text)

type MatchingLayout = { kind: 'first'; value: number } | { kind: 'second'; value: number }
const matchingParsed: unknown = JSON.parse('{"kind":"second","value":8}')
const matching = matchingParsed as MatchingLayout
console.log('matching-layout', matching.kind, matching.value)
