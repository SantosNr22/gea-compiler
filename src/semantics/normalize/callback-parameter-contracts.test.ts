import assert from 'node:assert/strict'
import test from 'node:test'
import { resolve } from 'node:path'
import ts from 'typescript'
import { indexValueFlow } from './flow/value-flow.js'
import { wholeProgram } from './reachability.js'
import {
  callbackContractParameterType,
  callbackParameterContractsFor,
  inlineJsxCallbackParameterType
} from './callback-parameter-contracts.js'
import { censusParameterBindings } from './parameter-bindings.js'

const contracts = (extra = '', consumer = '(event: Event) => void') => {
  const entry = resolve('test/fixtures/callback-parameter-contracts.ts')
  const source = `
    type Event = { target: { id: number } };
    function subscribe(listener: ${consumer}) {}
    function callback(event) { return event.target.id; }
    subscribe(callback);
    ${extra}
  `
  const options: ts.CompilerOptions = { target: ts.ScriptTarget.ES2022, strictNullChecks: true, noLib: true }
  const host = ts.createCompilerHost(options)
  const original = host.getSourceFile.bind(host)
  host.getSourceFile = (name, version, ...rest) =>
    resolve(name) === resolve(entry) ? ts.createSourceFile(name, source, version, true) : original(name, version, ...rest)
  const program = ts.createProgram([entry], options, host)
  const checker = program.getTypeChecker()
  const file = program.getSourceFile(entry)!
  const flow = indexValueFlow(checker, [file], wholeProgram)
  const callback = file.statements.find(
    (statement): statement is ts.FunctionDeclaration => ts.isFunctionDeclaration(statement) && statement.name?.text === 'callback'
  )!
  const counted = new Set(flow.calls.filter((site) => site.checkerDeclaration === callback).map((site) => site.call))
  return { checker, file, flow, callback, counted, result: callbackParameterContractsFor(checker, flow, callback, counted) }
}

test('named callback receives its stated higher-order parameter contract', () => {
  const { checker, result } = contracts()
  assert.ok(result && result.length === 1)
  const type = callbackContractParameterType(checker, result[0]!, 0)!
  assert.ok(checker.getPropertyOfType(type, 'target'))
})

test('all callback contracts are retained alongside counted direct calls', () => {
  const { result } = contracts(`function second(listener:(event:number)=>void){}; second(callback); callback({target:{id:1}});`)
  assert.equal(result?.length, 2)
})

test('an any callback input remains evidence that prevents a narrower partial inference', () => {
  const { checker, result } = contracts('function loose(listener:(event:any)=>void){}; loose(callback);')
  assert.ok(result && result.length === 2)
  assert.ok(result.some((contract) => (callbackContractParameterType(checker, contract, 0)!.flags & ts.TypeFlags.Any) !== 0))
})

test('open consumers, aliases, returns, exports and property publication do not establish closure', () => {
  for (const extra of [
    'function loose(listener:any){}; loose(callback);',
    'const alias=callback;',
    'function leak(){return callback}',
    'export { callback };',
    'export { callback as renamed };',
    'export default callback;',
    'const object={ callback };',
    'function unknown(){}; unknown(callback);'
  ])
    assert.ok(contracts(extra).result === null, extra)
})

test('counted call proof is required even when a typed callback boundary exists', () => {
  const { checker, flow, callback } = contracts('callback({target:{id:1}});')
  assert.equal(callbackParameterContractsFor(checker, flow, callback, new Set()), null)
})

test('optional callable contracts remain typed but open union destinations do not', () => {
  assert.equal(contracts('', '((event:Event)=>void)|undefined').result?.length, 1)
  assert.equal(contracts('', '((event:Event)=>void)|object').result, null)
})

test('generic receiving callbacks use the instantiated signature rather than its type parameter', () => {
  const { checker, result } = contracts(`
    function genericSubscribe<T>(listener:(event:T)=>void, value:T){}
    genericSubscribe<{target:{id:number}}>(callback,{target:{id:1}});
  `)
  assert.ok(result && result.length === 2)
  for (const contract of result) {
    const type = callbackContractParameterType(checker, contract, 0)
    assert.ok(type && checker.getPropertyOfType(type, 'target'))
    assert.equal(type.flags & ts.TypeFlags.TypeParameter, 0)
  }
})

test('parameter census infers a callback with no direct calls from its closed listener contract', () => {
  const { checker, file, callback } = contracts()
  const census = censusParameterBindings(checker, [file], wholeProgram)
  const type = census.typeAt(callback.parameters[0]!)
  assert.ok(type && checker.getPropertyOfType(type, 'target'))
})

test('parameter census never drops an incompatible direct caller to keep the callback contract', () => {
  const { checker, file, callback } = contracts('callback(7);')
  const census = censusParameterBindings(checker, [file], wholeProgram)
  const parameter = callback.parameters[0]!
  const type = census.typeAt(parameter)
  assert.ok(
    type === null ||
      (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0 ||
      (type.isUnion() && type.types.some((arm) => (arm.flags & ts.TypeFlags.NumberLike) !== 0))
  )
  const arms = census.unionArmsAt(parameter)
  assert.ok(arms === null || arms.some((arm) => (arm.flags & ts.TypeFlags.NumberLike) !== 0))
})

test('parameter census preserves any callback inputs as a real dynamic boundary', () => {
  const { checker, file, callback } = contracts('function loose(listener:(event:any)=>void){}; loose(callback);')
  const census = censusParameterBindings(checker, [file], wholeProgram)
  const parameter = callback.parameters[0]!
  const type = census.typeAt(parameter)
  assert.ok(type === null || (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0)
  assert.equal(census.unionArmsAt(parameter), null)
})

test('parameter census cannot discard an unresolved direct argument beside a typed callback contract', () => {
  const { checker, file, callback } = contracts('declare const external: any; callback(external);')
  const census = censusParameterBindings(checker, [file], wholeProgram)
  const parameter = callback.parameters[0]!
  const type = census.typeAt(parameter)
  assert.ok(type === null || (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0)
  assert.equal(census.unionArmsAt(parameter), null)
})

for (const reassigned of [false, true])
  test(`inline JSX callback structural view preserves its caller's native type, reassigned=${reassigned}`, () => {
    const entry = resolve('test/fixtures/inline-callback.tsx')
    const source = `
    interface NativeInput { target: { value: string; nativeId: number } }
    declare global { namespace JSX { interface IntrinsicElements { input: { onInput: (event: NativeInput) => void } } } }
    export {}
    const tree = <input onInput={(event: { target: { value: string } }) => {
      ${reassigned ? "event = { target: { value: 'local' } };" : ''}
      return event.target.value
    }} />
  `
    const options: ts.CompilerOptions = { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.Preserve, strict: true, noLib: true, types: [] }
    const host = ts.createCompilerHost(options)
    const original = host.getSourceFile.bind(host)
    host.getSourceFile = (name, version, ...rest) =>
      resolve(name) === entry ? ts.createSourceFile(name, source, version, true) : original(name, version, ...rest)
    const program = ts.createProgram([entry], options, host)
    const checker = program.getTypeChecker()
    const file = program.getSourceFile(entry)!
    let parameter: ts.ParameterDeclaration | undefined
    const visit = (node: ts.Node): void => {
      if (ts.isArrowFunction(node)) parameter = node.parameters[0]
      ts.forEachChild(node, visit)
    }
    visit(file)
    assert.ok(parameter)
    assert.ok(inlineJsxCallbackParameterType(checker, parameter), 'contextual callback type')
    const census = censusParameterBindings(checker, [file], wholeProgram)
    const type = census.typeAt(parameter)
    if (reassigned) assert.ok(type === null || checker.typeToString(type) !== 'NativeInput')
    else assert.equal(type && checker.typeToString(type), 'NativeInput')
  })
