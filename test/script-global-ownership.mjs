import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { isScriptGlobalObjectPropertyDeclaration } from '../dist/semantics/normalize/script-global-redefinition.js'

function declarations(source, fileName) {
  const options = { allowJs: true, checkJs: true, noLib: true, types: [], moduleDetection: ts.ModuleDetectionKind.Legacy }
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true)
  const host = ts.createCompilerHost(options)
  host.getSourceFile = (name) => (name === fileName ? file : undefined)
  const program = ts.createProgram([fileName], options, host)
  program.getTypeChecker()
  return file.statements.flatMap((statement) =>
    ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : ts.isFunctionDeclaration(statement) ? [statement] : []
  )
}

test('CommonJS wrapper vars and functions are not global-object properties', () => {
  const local = declarations('var count = 2; function read() { return count }; module.exports = read', 'wrapped.cjs')
  assert.equal(local.length, 2)
  assert.ok(local.every((declaration) => !isScriptGlobalObjectPropertyDeclaration(declaration)))
})

test('classic script var and function ownership remains on the global object', () => {
  const local = declarations('var count = 2; function read() { return count }; let lexical = 3', 'classic.js')
  assert.deepEqual(local.map(isScriptGlobalObjectPropertyDeclaration), [true, true, false])
})

test('ESM vars and functions remain lexical', () => {
  const local = declarations('var count = 2; function read() { return count }; export { read }', 'module.mjs')
  assert.ok(local.every((declaration) => !isScriptGlobalObjectPropertyDeclaration(declaration)))
})
