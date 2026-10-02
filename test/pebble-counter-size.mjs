import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

// Integration check for the workspace's real counter, compiler and Pebble SDK.
// Build dist first. Exercise Pebble's default workspace compiler selection.
const compiler = resolve(import.meta.dirname, '..')
const workspace = resolve(compiler, '..')
const app = resolve(workspace, 'examples/apps/counter-jsx')
const output = resolve(app, 'dist/pebble')
const environment = { ...process.env }
delete environment.GEA_GEATSC_BIN
delete environment.GEA_PEBBLE_UI
delete environment.GEA_PEBBLE_TOOLCHAIN
delete environment.GEA_PEBBLE_ALLOC_TRACE
execFileSync('bash', [resolve(workspace, 'pebble/packages/geastack-pebble/targets/pebble/build-pebble.sh'), app], {
  env: environment,
  stdio: 'inherit'
})
const decision = JSON.parse(readFileSync(resolve(output, '.generated/counter-jsx/pebble-ui.json'), 'utf8'))
assert.equal(decision.mode, 'compiled', 'counter must retain build-time UI compilation')
const image = readFileSync(resolve(output, 'project/src/c/gea_program_image.inc'), 'utf8')
const bytes = Number(image.match(/^#define GEA_PEBBLE_PROGRAM_IMAGE_SIZE (\d+)u$/m)?.[1])
assert.ok(Number.isSafeInteger(bytes) && bytes > 0, 'missing program image size')
assert.ok(bytes <= 10_000, `counter program is ${bytes} bytes; its budget is 10,000 bytes`)
console.log(`Pebble counter: ${bytes} program bytes; ${statSync(resolve(output, 'counter-jsx.pbw')).size} bundle bytes`)
