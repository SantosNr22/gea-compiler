// `for (let i = ...; ...; i++)` gives every iteration its own `i`
// (ECMA-262 14.7.4.2 CreatePerIterationEnvironment): a closure created in the
// body captures the binding of ITS iteration, and the increment runs on a
// fresh copy. At module scope a loop `let` must not become one shared global
// cell -- every closure then read the final value. The same holds for a
// `let`/`const` declared in a module-level loop BODY. Both printed the last
// value for every closure (`module:3,3,3`, `function:3,3,3`) before the
// renewal and the region-frame placement existed.
//! expect: module:0,1,2
//! expect: module-mutated:10,11,12
//! expect: function:0,1,2
//! expect: nested:0-0,0-1,1-0,1-1
//! expect: body-write:1,3,5|i-after-writes:5
//! expect: body-const-module:0,2,4
//! expect: body-const-function:0,2,4
//! expect: body-let-while-module:100,101,102
//! expect: body-let-mutated-function:0,11,2
//! expect: no-increment:1,2,3
//! expect: continue-string:a,aa,aaa,aaaa
//! expect: init-capture:0
const moduleFns: (() => number)[] = []
for (let i = 0; i < 3; i++) moduleFns.push(() => i)
console.log('module:' + moduleFns.map((f) => f()).join(','))

const mutated: (() => number)[] = []
for (let i = 0; i < 3; i++) {
  mutated.push(() => i)
  i += 10
  i -= 10
}
for (let k = 0; k < mutated.length; k++) {
  const f = mutated[k]!
  mutated[k] = () => f() + 10
}
console.log('module-mutated:' + mutated.map((f) => f()).join(','))

function inFunction(): string {
  const fns: (() => number)[] = []
  for (let i = 0; i < 3; i++) fns.push(() => i)
  return fns.map((f) => f()).join(',')
}
console.log('function:' + inFunction())

const nested: (() => string)[] = []
for (let a = 0; a < 2; a++) {
  for (let b = 0; b < 2; b++) nested.push(() => a + '-' + b)
}
console.log('nested:' + nested.map((f) => f()).join(','))

const writers: (() => number)[] = []
let seen = 0
for (let i = 0; i < 6; i++) {
  i++
  writers.push(() => i)
  seen = i
}
console.log('body-write:' + writers.map((f) => f()).join(',') + '|i-after-writes:' + seen)

const bodyConsts: (() => number)[] = []
for (let k = 0; k < 3; k++) {
  const x = k * 2
  bodyConsts.push(() => x)
}
console.log('body-const-module:' + bodyConsts.map((f) => f()).join(','))

function bodyConstInFunction(): string {
  const fns: (() => number)[] = []
  let k = 0
  while (k < 3) {
    const x = k * 2
    fns.push(() => x)
    k++
  }
  return fns.map((f) => f()).join(',')
}
console.log('body-const-function:' + bodyConstInFunction())

const whileModule: (() => number)[] = []
let w = 0
while (w < 3) {
  let y = w + 100
  whileModule.push(() => y)
  w++
}
console.log('body-let-while-module:' + whileModule.map((f) => f()).join(','))

function bodyLetMutatedInFunction(): string {
  const reads: (() => number)[] = []
  const bumps: (() => void)[] = []
  for (let k = 0; k < 3; k++) {
    let y = k
    reads.push(() => y)
    bumps.push(() => {
      y += 10
    })
  }
  bumps[1]!()
  return reads.map((f) => f()).join(',')
}
console.log('body-let-mutated-function:' + bodyLetMutatedInFunction())

const noIncrement: (() => number)[] = []
for (let i = 0; i < 3;) {
  noIncrement.push(() => i)
  i++
}
console.log('no-increment:' + noIncrement.map((f) => f()).join(','))

const withContinue: (() => string)[] = []
for (let s = 'a'; s.length < 5; s += 'a') {
  withContinue.push(() => s)
  if (s.length === 2) continue
  s += ''
}
console.log('continue-string:' + withContinue.map((f) => f()).join(','))

function initCapture(): string {
  const out: number[] = []
  let first: (() => number) | null = null
  for (let i = 0, g = (): number => i; i < 3; i++) {
    if (first === null) first = g
  }
  out.push(first === null ? -1 : first())
  return out.join(',')
}
console.log('init-capture:' + initCapture())
