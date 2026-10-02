import assert from 'node:assert/strict'
import test from 'node:test'
import { resolve } from 'node:path'
import { compile } from '../dist/compiler.js'
import { memberProofStats } from '../dist/semantics/normalize/flow/callable-reach.js'

// A store of mutually-calling drawing methods, read reactively by components.
// Every method proof walks every mention of the shared instance, and a mention
// that calls another method asks THAT method's proof, nested, so each answer is
// conditional on which other methods are parked above it, and the receiver walk
// re-enters the same mentions along every path through the cycle. Both used to
// be exponential in the number of methods: ten methods cost 189,000 proof
// entries and ~4.3s (the Amuse voice agent's compile effectively hung), forty
// overflowed the stack.
//
// The bounds are on WORK (proof entries), not seconds, so a loaded machine
// cannot fail them (measured: about 200 and 1,600 entries). Each program needs its own process: the counters are
// module-level and cumulative.
const root = resolve(import.meta.dirname, '..')
const entriesFor = (name) => {
  const result = compile({
    rootFileNames: [resolve(root, `test/runtime/${name}.tsx`)],
    projectFileName: resolve(root, `test/runtime/${name}.tsconfig.json`),
    closedScriptScope: true
  })
  assert.ok(result.certificate, JSON.stringify(result.diagnostics.diagnostics))
  return Number(/entries=(\d+)/.exec(memberProofStats())?.[1])
}
const which = process.env.PROOF_MEMO_PROGRAM
if (which) {
  test(`${which}: proof work stays bounded`, () => {
    const entries = entriesFor(which)
    assert.ok(entries < 5000, `member proof entries ${entries}`)
  })
} else {
  const { spawnSync } = await import('node:child_process')
  for (const name of ['jsx-shared-store-drawing-math', 'jsx-shared-store-forty-methods']) {
    test(`${name}: proof work stays bounded`, () => {
      const run = spawnSync(process.execPath, ['--test', import.meta.filename], {
        env: { ...process.env, PROOF_MEMO_PROGRAM: name },
        encoding: 'utf8'
      })
      assert.equal(run.status, 0, run.stdout + run.stderr)
    })
  }
}
