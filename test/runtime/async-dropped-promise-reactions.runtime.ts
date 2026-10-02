// A CALLER MAY DROP A PENDING ASYNC CALL'S PROMISE THE MOMENT IT ATTACHES A REACTION.
//
// `f().catch(g)` / `f().then(g)` keep no handle to `f()`'s promise, yet the
// frame must still settle it so the reaction fires, however many awaits the
// callee takes, and whether it fulfills or rejects. A call whose promise is
// dropped with NO reaction attached just runs to its end.
const log: string[] = []

function microtask(job: () => void): void {
  Promise.resolve().then(job)
}

async function oneAwaitThrows(): Promise<number> {
  await Promise.resolve(0)
  throw new Error('one')
}

async function manyAwaitsThrows(): Promise<number> {
  await Promise.resolve(0)
  await undefined
  await Promise.resolve(1)
  throw new Error('many')
}

async function manyAwaitsFulfills(): Promise<number> {
  await undefined
  await Promise.resolve(0)
  await undefined
  return 7
}

async function voidAfterAwait(): Promise<void> {
  await undefined
  log.push('void:ran')
}

async function voidThrows(): Promise<void> {
  await undefined
  await undefined
  throw new Error('void')
}

async function noReaction(tag: string): Promise<number> {
  log.push(tag + ':start')
  await undefined
  log.push(tag + ':after1')
  await Promise.resolve(0)
  log.push(tag + ':after2')
  return 1
}

oneAwaitThrows().catch((e) => log.push('catch-one:' + (e as Error).message))
manyAwaitsThrows().catch((e) => log.push('catch-many:' + (e as Error).message))
manyAwaitsFulfills().then((v) => log.push('then-many:' + v))
manyAwaitsThrows().then(
  () => log.push('then2-ok'),
  (e) => log.push('then2-err:' + (e as Error).message)
)
voidAfterAwait().then(() => log.push('void:then'))
voidThrows().catch((e) => log.push('void-catch:' + (e as Error).message))
// Dropped with no reaction: still runs to completion, nothing observes it.
void noReaction('dropped')
// A reaction attached late, after the callee has already suspended twice.
const late = noReaction('late')
microtask(() => microtask(() => late.then((v) => log.push('late:then' + v))))
// Two reactions on one dropped-handle chain.
const both = manyAwaitsFulfills()
both.then((v) => log.push('both-a:' + v))
both.then((v) => log.push('both-b:' + v))
log.push('sync-end')

let guard = 0
function flush(): void {
  if (++guard < 30) Promise.resolve().then(flush)
  else console.log(log.join(' '))
}
flush()
//! expect: dropped:start late:start sync-end void:ran dropped:after1 late:after1 catch-one:one void:then dropped:after2 late:after2 void-catch:void late:then1 catch-many:many then-many:7 then2-err:many both-a:7 both-b:7
