import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import { createProgram, defaultCompilerOptions } from '../dist/semantics/program.js'
import { censusParameterBindings, indexParameterBindingProgram } from '../dist/semantics/normalize/parameter-bindings.js'
import { wholeProgram } from '../dist/semantics/normalize/reachability.js'
import { indexValueFlow } from '../dist/semantics/normalize/flow/value-flow.js'
import { attachStatedModuleSet } from '../dist/semantics/normalize/flow/targets.js'

const inspect = (extra = '', implementation = 'Signal') => {
  const entry = resolve('test/fixtures/interface-method-parameter-evidence.ts')
  const source = `export {};
    interface Signaling { request(command: string, fields: object): string }
    class Signal { request(command: string, fields: object): string { return JSON.stringify(fields) } }
    class Child extends Signal {}
    class Media {
      constructor(private options: { signaling: Signaling }) {}
      start() { return this.options.signaling.request('transport', { direction: 'recv' }) }
    }
    const signal = new ${implementation}();
    signal.request('join', { profile: 'baseline', authorization: 'example' });
    new Media({ signaling: signal }).start();
    ${extra}
  `
  const compiled = createProgram({
    rootFileNames: [entry],
    projectFileName: null,
    options: { ...defaultCompilerOptions, types: [] },
    sourceOverlay: new Map([[entry, source]])
  })
  const { checker, sourceFiles, entryFiles } = compiled
  assert.deepEqual(compiled.diagnostics, [])
  const flow = indexValueFlow(checker, sourceFiles, wholeProgram)
  attachStatedModuleSet(flow, { files: sourceFiles, entries: entryFiles })
  const index = indexParameterBindingProgram(checker, sourceFiles, wholeProgram, flow)
  const census = censusParameterBindings(checker, sourceFiles, wholeProgram, undefined, index, flow)
  const file = compiled.program.getSourceFile(entry)
  const contract = file.statements.find(ts.isInterfaceDeclaration).members[0]
  const method = file.statements.find((node) => ts.isClassDeclaration(node) && node.name.text === 'Signal').members[0]
  return { checker, index, census, contract, method }
}

test('structural interface caller evidence reaches the actual class method, including inherited methods', () => {
  for (const implementation of ['Signal', 'Child']) {
    const { checker, index, census, contract, method } = inspect('', implementation)
    assert.deepEqual(index.interfaceMemberBodies.get(contract), [method])
    const parameter = method.parameters[1]
    const type = census.typeAt(parameter)
    const arms = census.unionArmsAt(parameter) ?? (type?.isUnion() ? type.types : [type])
    assert.ok(arms.some((arm) => arm && checker.getPropertyOfType(arm, 'direction')))
    assert.ok(arms.some((arm) => arm && checker.getPropertyOfType(arm, 'authorization')))
  }
})

test('a nonclass implementation prevents the class-only interface carrier claim', () => {
  const { index, contract } = inspect('new Media({ signaling: { request(command: string, fields: object) { return command } } }).start();')
  assert.equal(index.interfaceMemberBodies.has(contract), false)
})

test('a method handed to unknown code cannot narrow from its visible callers', () => {
  const { census, method } = inspect('declare function external(value: Signal): void; external(signal);')
  assert.equal(census.typeAt(method.parameters[1]), null)
  assert.equal(census.unionArmsAt(method.parameters[1]), null)
})
