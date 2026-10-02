import assert from 'node:assert/strict'
import test from 'node:test'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'
import { wholeProgram } from '../reachability.js'
import { censusParameterBindings, indexParameterBindingProgram } from '../parameter-bindings.js'
import { attachStatedModuleSet } from './targets.js'
import { classConstructorKeepsInstanceOf } from './member-call-forwarding.js'
import { indexValueFlow } from './value-flow.js'

const programFor = (
  entrySource: string,
  reexport = false,
  sourceText = 'export class Receiver { hook() {} } export function inspect(value) { console.log(value.hook === value.hook) }'
) => {
  const source = resolve('test/fixtures/class-origin-source.ts')
  const entry = resolve('test/fixtures/class-origin-entry.ts')
  const barrel = resolve('test/fixtures/class-origin-barrel.ts')
  const contents = new Map([
    [source, sourceText],
    [entry, `declare function external(value: unknown): void; ${entrySource}`]
  ])
  if (reexport) contents.set(barrel, 'export { Receiver as Alias } from "./class-origin-source"')
  const options: ts.CompilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, types: [] }
  const host = ts.createCompilerHost(options)
  const original = host.getSourceFile.bind(host)
  host.getSourceFile = (name, version, ...rest) => {
    const text = contents.get(resolve(name))
    return text === undefined ? original(name, version, ...rest) : ts.createSourceFile(name, text, version, true)
  }
  host.resolveModuleNames = (names, containingFile) =>
    names.map((name) => ({ resolvedFileName: resolve(dirname(containingFile), `${name}.ts`), extension: ts.Extension.Ts }))
  const program = ts.createProgram([...contents.keys()], options, host)
  const diagnostics = program.getSemanticDiagnostics()
  assert.equal(
    diagnostics.length,
    0,
    diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('\n')
  )
  const checker = program.getTypeChecker()
  const files = [...contents.keys()].map((name) => program.getSourceFile(name)!)
  return { checker, files, flow: indexValueFlow(checker, files, wholeProgram) }
}

const constructorIsClosed = (entrySource: string, reexport = false): boolean => {
  const { checker, files, flow } = programFor(entrySource, reexport)
  const declaration = files[0]!.statements.find(ts.isClassDeclaration)!
  const type = checker.getDeclaredTypeOfSymbol(checker.getSymbolAtLocation(declaration.name!)!)
  assert.ok(type.isClassOrInterface())
  return classConstructorKeepsInstanceOf(checker, flow, type)
}

test('resolved named and namespace constructor imports retain known construction uses', () => {
  assert.equal(constructorIsClosed('import {Receiver} from "./class-origin-source"; new Receiver();'), true)
  assert.equal(constructorIsClosed('import * as api from "./class-origin-source"; new api.Receiver();'), true)
})

test('an imported constructor cannot hide an opaque consumer from its declaring class', () => {
  assert.equal(constructorIsClosed('import {Receiver as Alias} from "./class-origin-source"; external(Alias); new Alias();'), false)
  assert.equal(constructorIsClosed('import {Alias} from "./class-origin-barrel"; external(Alias); new Alias();', true), false)
})

test('an escaped module namespace exposes its exported constructor values', () => {
  assert.equal(constructorIsClosed('import * as api from "./class-origin-source"; external(api); new api.Receiver();'), false)
})

test('ordinary imported function forwarding retains its complete receiver parameter evidence', () => {
  const { checker, files } = programFor(`
    import { inspect } from "./class-origin-source";
    class Local { hook(value: any) {} }
    const local = new Local();
    local.hook = function(value) { return value.amount };
    inspect(local);
    local.hook({ amount: 3 });
  `)
  const assignment = files[1]!.statements
    .filter(ts.isExpressionStatement)
    .map((statement) => statement.expression)
    .find((expression) => ts.isBinaryExpression(expression) && ts.isFunctionExpression(expression.right))
  assert.ok(assignment && ts.isBinaryExpression(assignment) && ts.isFunctionExpression(assignment.right))
  const parameter = assignment.right.parameters[0]!
  for (const stated of [false, true]) {
    const index = indexParameterBindingProgram(checker, files, wholeProgram)
    if (stated) attachStatedModuleSet(index.valueFlow, { files, entries: [files[1]!], reachable: wholeProgram })
    const census = censusParameterBindings(checker, files, wholeProgram, undefined, index)
    const type = census.typeAt(parameter)
    if (stated) assert.ok(type && checker.getPropertyOfType(type, 'amount'))
    else assert.ok(type === null || (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0)
  }
})

test('forwarding exported instance cells follows all importers and still rejects opaque escapes', () => {
  for (const escape of ['', 'external(channel);', 'export { channel };']) {
    const { checker, files } = programFor(
      `import { channel } from "./class-origin-source"; channel.send({ amount: 3 }); ${escape}`,
      false,
      'class Channel { send(fields: object) { return JSON.stringify(fields) } } export const channel = new Channel();'
    )
    const owner = files[0]!.statements.find(ts.isClassDeclaration)!
    const method = owner.members.find(ts.isMethodDeclaration)!
    const parameter = method.parameters[0]!
    const index = indexParameterBindingProgram(checker, files, wholeProgram)
    attachStatedModuleSet(index.valueFlow, { files, entries: [files[1]!], reachable: wholeProgram })
    const census = censusParameterBindings(checker, files, wholeProgram, undefined, index)
    const inferred = census.typeAt(parameter)
    assert.equal(Boolean(inferred && checker.getPropertyOfType(inferred, 'amount')), escape === '', escape)
  }
})

test('nullable interface fields retain the argument evidence of their concrete implementation', () => {
  const { checker, files } = programFor(
    'import { Controller, createCall } from "./class-origin-source"; const controller = new Controller({createCall}); controller.start(); controller.stop();',
    false,
    `
      class Channel { send(fields: object) { console.log(JSON.stringify(fields)) } }
      interface Call { start(): void; stop(): void }
      class NativeCall implements Call {
        private channel = new Channel();
        start() { this.channel.send({ authorization: 'credential' }) }
        stop() {}
      }
      export function createCall(): Call { return new NativeCall() }
      export class Controller {
        private call: Call | null = null;
        constructor(private options: { createCall(): Call }) {}
        start() { this.call = this.options.createCall(); this.call.start() }
        stop() { this.call?.stop(); this.call = null }
      }
    `
  )
  const owner = files[0]!.statements.find(ts.isClassDeclaration)!
  const parameter = owner.members.find(ts.isMethodDeclaration)!.parameters[0]!
  const index = indexParameterBindingProgram(checker, files, wholeProgram)
  attachStatedModuleSet(index.valueFlow, { files, entries: [files[1]!], reachable: wholeProgram })
  const census = censusParameterBindings(checker, files, wholeProgram, undefined, index)
  const inferred = census.typeAt(parameter)
  assert.ok(inferred && checker.getPropertyOfType(inferred, 'authorization'))
})

test('interface call frames keep payload evidence only for closed receivers', () => {
  for (const escape of ['', 'external(channel);']) {
    const { checker, files } = programFor(
      `import { Channel, Writer } from "./class-origin-source";
       const channel = new Channel(); const writer: Writer = channel;
       writer.send({ direction: 'recv' }); ${escape}`,
      false,
      `export interface Writer { send(fields: object): void }
       export class Channel { send(fields: object) { console.log(JSON.stringify(fields)) } }`
    )
    const owner = files[0]!.statements.find(ts.isInterfaceDeclaration)!
    const parameter = owner.members.find(ts.isMethodSignature)!.parameters[0]!
    const index = indexParameterBindingProgram(checker, files, wholeProgram)
    attachStatedModuleSet(index.valueFlow, { files, entries: [files[1]!], reachable: wholeProgram })
    const census = censusParameterBindings(checker, files, wholeProgram, undefined, index)
    const inferred = census.typeAt(parameter)
    assert.equal(Boolean(inferred && checker.getPropertyOfType(inferred, 'direction')), escape === '', escape)
  }
})
