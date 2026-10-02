// `break`/`continue` inside `try { } finally { }` nested in a loop: the
// completion is abrupt, so the finally clause runs first and the transfer
// happens after it (ECMA-262 14.15.3: a `break`/`continue` completion from
// the try block is replaced only if the finally itself completes abruptly).
// Lowering refused every such loop with "target has not been lowered to a
// block yet": the graph's only completion edge named the finally boundary,
// never the loop. Once lowered, a try part's reachability walk also swept an
// enclosing loop's blocks in -- and cut out the statement's own blocks that
// lead to a `continue` -- so they rendered outside the braces (observed: the
// finally ran before the work, and a testless loop's exit ran inside the try).
//! expect: for:body0,fin0,fin1,body2,fin2,fin3
//! expect: while:body1,fin1,fin2,body3,fin3,fin4|w=4
//! expect: nested:b00,in00,out00,in01,out01,b10,in10,out10,in11,out11,b20,in20,out20,in21,out21
//! expect: work-before-continue:body0,fin0,skip1,fin1,body2,fin2
//! expect: testless:fin1,leaving,fin2,after
//! expect: catch-only:ok0,caught:boom1,ok2
//! expect: function:1+3#4
//! expect: catch:t0,f0,after0,t1,f1,after1,ce2,f2,f3
//! expect: async:t0,f0,a0,f1,t2,f2,a2,f3
//! expect: async-nested:b00,in00,out00,in01,out01,b10,in10,out10,in11,out11
const log: string[] = []

for (let i = 0; i < 5; i++) {
  try {
    if (i === 1) continue
    if (i === 3) break
    log.push('body' + i)
  } finally {
    log.push('fin' + i)
  }
}
console.log('for:' + log.join(','))

log.length = 0
let w = 0
while (w < 5) {
  w++
  try {
    if (w === 2) continue
    if (w === 4) break
    log.push('body' + w)
  } finally {
    log.push('fin' + w)
  }
}
console.log('while:' + log.join(',') + '|w=' + w)

log.length = 0
outer: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    try {
      try {
        if (j === 1) continue outer
        log.push('b' + i + j)
      } finally {
        log.push('in' + i + j)
      }
    } finally {
      log.push('out' + i + j)
    }
  }
  log.push('never' + i)
}
console.log('nested:' + log.join(','))

log.length = 0
for (let i = 0; i < 3; i++) {
  try {
    if (i === 1) {
      log.push('skip' + i)
      continue
    }
    log.push('body' + i)
  } finally {
    log.push('fin' + i)
  }
}
console.log('work-before-continue:' + log.join(','))

log.length = 0
let spins = 0
while (true) {
  try {
    spins++
    if (spins === 2) {
      log.push('leaving')
      break
    }
  } finally {
    log.push('fin' + spins)
  }
}
log.push('after')
console.log('testless:' + log.join(','))

// No finally at all: a block that throws and then `continue`s is still under
// the handler. It leads back to the try entry through the loop latch exactly
// as the latch does, which is the shape the reachability walk cut out.
log.length = 0
const explode = (n: number): void => {
  if (n === 1) throw new Error('boom' + n)
}
for (let i = 0; i < 3; i++) {
  try {
    if (i === 1) {
      explode(i)
      continue
    }
    log.push('ok' + i)
  } catch (error) {
    log.push('caught:' + (error as Error).message)
  }
}
console.log('catch-only:' + log.join(','))

function breakInFunction(limit: number): string {
  const seen: number[] = []
  let count = 0
  for (const n of [1, 2, 3, 4, 5]) {
    try {
      if (n > limit) break
      if (n % 2 === 0) continue
      seen.push(n)
    } finally {
      count++
    }
  }
  return seen.join('+') + '#' + count
}
console.log('function:' + breakInFunction(3))

function breakWithCatch(): string {
  const out: string[] = []
  for (let i = 0; i < 4; i++) {
    try {
      if (i === 2) throw new Error('e' + i)
      if (i === 3) break
      out.push('t' + i)
    } catch (error) {
      out.push('c' + (error as Error).message)
      continue
    } finally {
      out.push('f' + i)
    }
    out.push('after' + i)
  }
  return out.join(',')
}
console.log('catch:' + breakWithCatch())

async function asyncFinally(): Promise<string> {
  const out: string[] = []
  for (let i = 0; i < 4; i++) {
    try {
      if (i === 1) continue
      if (i === 3) break
      out.push('t' + i)
    } finally {
      await Promise.resolve()
      out.push('f' + i)
    }
    out.push('a' + i)
  }
  return out.join(',')
}
asyncFinally().then((text) => console.log('async:' + text))

async function asyncNestedFinally(): Promise<string> {
  const out: string[] = []
  outer: for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      try {
        try {
          if (j === 1) continue outer
          out.push('b' + i + j)
        } finally {
          await Promise.resolve()
          out.push('in' + i + j)
        }
      } finally {
        await Promise.resolve()
        out.push('out' + i + j)
      }
    }
    out.push('never')
  }
  return out.join(',')
}
asyncNestedFinally().then((text) => console.log('async-nested:' + text))
