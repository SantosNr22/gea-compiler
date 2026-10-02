// An async body with try/catch/finally keeps its ordering: every await is one
// microtask whichever of the body, handler or finally it sits in, and a
// rejection reaches the handler, then the finally, then the caller.
const log: string[] = []

function microtask(job: () => void): void {
  Promise.resolve().then(job)
}

async function work(tag: string, fail: boolean): Promise<number> {
  const before = tag + ':' + (fail ? 'f' : 'ok')
  log.push(before)
  try {
    await undefined
    log.push(tag + ':body1')
    if (fail) throw new Error(tag)
    const inner = await Promise.resolve(tag.length)
    log.push(tag + ':body2:' + inner)
    return inner
  } catch (e) {
    log.push(tag + ':catch:' + (e as Error).message)
    await undefined
    log.push(tag + ':catch-after')
    return -1
  } finally {
    const note = tag + ':finally'
    log.push(note)
    await Promise.resolve()
    log.push(tag + ':finally-after')
  }
}

async function outer(): Promise<void> {
  const a = await work('a', false)
  const b = await work('b', true)
  log.push('outer:' + a + ':' + b)
}

microtask(() => log.push('m1'))
const p1 = work('x', false)
const p2 = work('yy', true)
const p3 = outer()
microtask(() => log.push('m2'))
log.push('sync-end')

async function finish(): Promise<void> {
  const r1 = await p1
  const r2 = await p2
  await p3
  microtask(() => console.log(log.join(' ') + ' ' + r1 + ',' + r2))
}
finish()
//! expect: x:ok yy:f a:ok sync-end m1 x:body1 yy:body1 yy:catch:yy a:body1 m2 x:body2:1 x:finally yy:catch-after yy:finally a:body2:1 a:finally x:finally-after yy:finally-after a:finally-after b:f b:body1 b:catch:b b:catch-after b:finally b:finally-after outer:1:-1 1,-1
