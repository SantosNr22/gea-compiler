import assert from 'node:assert/strict'
import test from 'node:test'
import { resolve } from 'node:path'
import ts from 'typescript'
import { symbolWritesNoIntrinsicProperty } from './host-effect-contracts.js'

test('native contracts compose with library overloads without admitting uncovered hosts or library mutators', () => {
  const entry = resolve('test/fixtures/host-effect-overloads.ts')
  const source = `
    export {}
    declare global {
      /** @gea-host-no-property-writes */
      function setTimeout(callback: () => void, delay: number): number
      function clearTimeout(handle: number): void
      /** @gea-host-no-property-writes */
      function customHost(value: object): void
      function customHost(value: string): void
    }
  `
  const options: ts.CompilerOptions = { target: ts.ScriptTarget.ES2022, strict: true, types: [] }
  const host = ts.createCompilerHost(options, true)
  const read = host.getSourceFile.bind(host)
  host.getSourceFile = (path, version, onError, fresh) =>
    resolve(path) === entry ? ts.createSourceFile(path, source, version, true) : read(path, version, onError, fresh)
  const program = ts.createProgram([entry], options, host)
  const checker = program.getTypeChecker()
  const file = program.getSourceFile(entry)!
  const global = (name: string): ts.Symbol => {
    const symbol = checker.resolveName(name, file, ts.SymbolFlags.Value, false)
    assert.ok(symbol)
    return symbol
  }
  const timeout = global('setTimeout')
  assert.ok(timeout.declarations!.some((declaration) => declaration.getSourceFile().hasNoDefaultLib))
  assert.equal(symbolWritesNoIntrinsicProperty(timeout), true)
  assert.equal(symbolWritesNoIntrinsicProperty(global('clearTimeout')), false)
  assert.equal(symbolWritesNoIntrinsicProperty(global('customHost')), false)
  const object = checker.getTypeOfSymbolAtLocation(global('Object'), file)
  assert.equal(symbolWritesNoIntrinsicProperty(object.getProperty('assign')), false)
  assert.equal(symbolWritesNoIntrinsicProperty(object.getProperty('keys')), true)
})
