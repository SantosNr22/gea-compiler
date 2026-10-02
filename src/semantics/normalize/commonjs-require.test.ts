import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import type { CommonJsWrapperDeclaration } from '../../plugins/model.js'
import { createCommonJsRequireCensus, type CommonJsRequireStatus } from './commonjs-require.js'

const wrapperName = resolve('/commonjs-require-wrapper.d.ts')
const moduleName = resolve('/commonjs-require-module.ts')
const wrapper = `
export {}
declare global {
  var require: (specifier: string) => any
  var exports: any
  var module: { exports: any }
}
`

const globals = new Map<string, CommonJsWrapperDeclaration>(
  (['require', 'exports', 'module'] as const).map((name) => [
    name,
    { global: name, declarationName: name, declarationFileName: wrapperName }
  ])
)

/** Every `require( 'x' )` call's status, in source order. */
const statusesOf = (text: string): readonly CommonJsRequireStatus[] => {
  const options: ts.CompilerOptions = { noLib: true, strict: true, types: [] }
  const host = ts.createCompilerHost(options)
  const sources = new Map([
    [wrapperName, wrapper],
    [moduleName, text]
  ])
  const read = host.getSourceFile.bind(host)
  host.getSourceFile = (file, language, ...rest) => {
    const source = sources.get(resolve(file))
    return source === undefined ? read(file, language, ...rest) : ts.createSourceFile(file, source, language, true)
  }
  const program = ts.createProgram([wrapperName, moduleName], options, host)
  const source = program.getSourceFile(moduleName)
  assert.ok(source)
  const census = createCommonJsRequireCensus(program.getTypeChecker(), program.getSourceFiles(), globals)
  const statuses: CommonJsRequireStatus[] = []
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]!))
      statuses.push(census.statusOf(node.expression))
    ts.forEachChild(node, visit)
  }
  visit(source)
  return statuses
}

test('a require in a function body this module never calls is static when nothing writes require', () => {
  assert.deepEqual(
    statusesOf(`
export function load() { return require('./a') }
export class Loader { get() { return require('./b') } }
export const arrow = () => require('./c')
`),
    ['static', 'static', 'static']
  )
})

test('an unresolved call cannot make a require unknown when no function of this module writes it', () => {
  assert.deepEqual(
    statusesOf(`
declare const somethingElse: () => void
somethingElse()
require('./a')
`),
    ['static']
  )
})

test('a module that writes require anywhere keeps uncalled function-body reads off the static path', () => {
  assert.deepEqual(
    statusesOf(`
export function load() { return require('./a') }
export function replace() { require = (specifier: string) => ({ specifier }) }
`),
    ['ordinary']
  )
})

test('a direct eval or the wrapper arguments object counts as a require writer', () => {
  assert.deepEqual(
    statusesOf(`declare function eval(source: string): unknown\nexport function load() { return require('./a') }\neval(String(0))`),
    ['ordinary']
  )
  assert.deepEqual(statusesOf(`export function load() { return require('./a') }\nexport const peek = () => arguments`), ['ordinary'])
})

test('arguments inside an ordinary function does not alias the wrapper cells', () => {
  assert.deepEqual(statusesOf(`export function load() { return arguments.length === 0 ? require('./a') : null }`), ['static'])
})
