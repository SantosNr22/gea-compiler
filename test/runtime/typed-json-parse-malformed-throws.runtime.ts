// ECMA-262 25.5.1 JSON.parse step 2: text that is not valid JSON throws a
// SyntaxError. The native reader behind `JSON.parse(text) as T` used to stop
// at the first grammar error and hand back whatever it had read so far --
// `JSON.parse('')` was an empty record -- which is a silently wrong answer.
// A document that is well-formed but a different SHAPE than `T` is a separate
// question (this backend's own choice to keep defaults) and is not tested here.
interface Point {
  a: number
}

const parsePoint = (text: string): string => {
  try {
    const point = JSON.parse(text) as Point
    return `ok ${point.a}`
  } catch (error) {
    return error instanceof Error ? error.name : 'non-error'
  }
}

const parseNumbers = (text: string): string => {
  try {
    const numbers = JSON.parse(text) as number[]
    return `ok ${numbers.length}`
  } catch (error) {
    return error instanceof Error ? error.name : 'non-error'
  }
}

const parseDynamic = (text: string): string => {
  try {
    const value: unknown = JSON.parse(text)
    return `ok ${typeof value}`
  } catch (error) {
    return error instanceof Error ? error.name : 'non-error'
  }
}

for (const text of ['', '{', '{"a":1', 'nul', '{"a":1}x', '{"a":1}', ' {"a" : 2 } ']) {
  console.log(JSON.stringify(text), parsePoint(text))
}
for (const text of ['[1,2', '[1,]', '[01]', '[+1]', '[.5]', '[1.]', '[1e]', '[-]', '[1,2]', '["a\u0001"]']) {
  console.log(JSON.stringify(text), parseNumbers(text))
}
for (const text of ['', '{"a":1,}', '{"a" 1}', '"\\x"', '"\\u12G4"', 'tru', '{"a":[1,2}', '{"a":{"b":1}}', 'null']) {
  console.log(JSON.stringify(text), parseDynamic(text))
}
//! expect: "" SyntaxError
//! expect: "{" SyntaxError
//! expect: "{\"a\":1" SyntaxError
//! expect: "nul" SyntaxError
//! expect: "{\"a\":1}x" SyntaxError
//! expect: "{\"a\":1}" ok 1
//! expect: " {\"a\" : 2 } " ok 2
//! expect: "[1,2" SyntaxError
//! expect: "[1,]" SyntaxError
//! expect: "[01]" SyntaxError
//! expect: "[+1]" SyntaxError
//! expect: "[.5]" SyntaxError
//! expect: "[1.]" SyntaxError
//! expect: "[1e]" SyntaxError
//! expect: "[-]" SyntaxError
//! expect: "[1,2]" ok 2
//! expect: "[\"a\u0001\"]" SyntaxError
//! expect: "" SyntaxError
//! expect: "{\"a\":1,}" SyntaxError
//! expect: "{\"a\" 1}" SyntaxError
//! expect: "\"\\x\"" SyntaxError
//! expect: "\"\\u12G4\"" SyntaxError
//! expect: "tru" SyntaxError
//! expect: "{\"a\":[1,2}" SyntaxError
//! expect: "{\"a\":{\"b\":1}}" ok object
//! expect: "null" ok object
