import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import test from 'node:test'

test('C++ emission refusals retain the source call location', () => {
  const root = resolve(import.meta.dirname, '..')
  const output = execFileSync(process.execPath, ['dist/cli.js', '--emit', 'test/runtime/class-json-reflection-refused.ts'], {
    cwd: root,
    encoding: 'utf8'
  })
  assert.match(output, /print\s+test\/runtime\/class-json-reflection-refused\.ts:19:15/)
  assert.match(output, /host-member-call:JSON\.stringify/)
})
