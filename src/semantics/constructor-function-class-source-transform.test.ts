import assert from 'node:assert/strict'
import { test } from 'node:test'
import ts from 'typescript'
import { constructorFunctionClassSourceTransform as transform } from './constructor-function-class-source-transform.js'

const syntaxErrors = (text: string): number => {
  const file = ts.createSourceFile('out.js', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  return (file as unknown as { parseDiagnostics: unknown[] }).parseDiagnostics.length
}

test('a guarded constructor becomes a class plus the factory its plain calls meant', () => {
  const text = [
    'module.exports = Pager',
    '',
    'function Pager (pageSize, opts) {',
    '  if (!(this instanceof Pager)) return new Pager(pageSize, opts)',
    '  this.pageSize = pageSize || 1024',
    '}',
    '',
    'Pager.prototype.get = function (i) {',
    '  return new Page(i, this.pageSize)',
    '}',
    '',
    'function Page (i, size) {',
    '  this.offset = i * size',
    '}',
    ''
  ].join('\n')
  const actual = transform({ fileName: 'index.js', text })!
  assert.equal(syntaxErrors(actual), 0)
  assert.match(actual, /^class Pager\$class \{\n {2}constructor\(pageSize, opts\) \{\n {2}this\.pageSize = pageSize \|\| 1024\n\}/)
  assert.match(actual, /get\(i\) \{\n {2}return new Page\(i, this\.pageSize\)\n\}/)
  assert.match(actual, /function Pager\(pageSize, opts\) \{\n {2}return new Pager\$class\(pageSize, opts\)\n\}/)
  assert.doesNotMatch(actual, /prototype|instanceof/)
  // `Page` has no prototype members; it is left to the checker's own constructor inference.
  assert.match(actual, /function Page \(i, size\)/)
})

test('an unguarded constructor keeps its name, and constructions in the file keep naming it', () => {
  const text = [
    '"use strict"',
    'var b = new Box(1)',
    'function Box (v) { this.v = v }',
    'Box.prototype.twice = function () { return this.v * 2 }'
  ].join('\n')
  const actual = transform({ fileName: 'box.js', text })!
  assert.equal(syntaxErrors(actual), 0)
  assert.ok(actual.startsWith('"use strict"\nclass Box {'))
  assert.match(actual, /var b = new Box\(1\)/)
  assert.match(actual, /twice\(\) \{ return this\.v \* 2 \}/)
})

test('a guarded constructor renames constructions and instanceof checks elsewhere in the file', () => {
  const text = [
    'function Bits (o) { if (!(this instanceof Bits)) return new Bits(o); this.o = o }',
    'Bits.prototype.get = function () { return this.o }',
    'function make () { return new Bits(1) }',
    'function is (x) { return x instanceof Bits }'
  ].join('\n')
  const actual = transform({ fileName: 'bits.js', text })!
  assert.match(actual, /return new Bits\$class\(1\)/)
  assert.match(actual, /x instanceof Bits\$class/)
})

test('uses the class cannot state leave the file as written', () => {
  for (const text of [
    // An unguarded constructor called without `new`.
    'function F () { this.a = 1 }\nF.prototype.m = function () {}\nF()',
    // A prototype data value.
    'function F () {}\nF.prototype.m = function () {}\nF.prototype.kind = 1',
    // `F.prototype` read elsewhere.
    'function F () {}\nF.prototype.m = function () {}\nvar p = F.prototype',
    // `F` as a value: inheritance, static members, passed on.
    'function F () {}\nF.prototype.m = function () {}\nutil.inherits(F, Base)',
    'function F () {}\nF.prototype.m = function () {}\nF.create = function () {}',
    // A constructor returning a value.
    'function F () { return {} }\nF.prototype.m = function () {}',
    // A method reading its own function name.
    'function F () {}\nF.prototype.m = function m () { return m }',
    // Assigned twice.
    'function F () {}\nF.prototype.m = function () {}\nF.prototype.m = function () {}'
  ])
    assert.equal(transform({ fileName: 'f.js', text }), null, text)
})

test('TypeScript files are left alone', () => {
  assert.equal(transform({ fileName: 'f.ts', text: 'function F () {}\nF.prototype.m = function () {}' }), null)
})
