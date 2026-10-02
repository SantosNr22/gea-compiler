// `then` REACTIONS AND AWAIT CONTINUATIONS SHARE ONE FIFO JOB QUEUE.
//
// ECMA-262 has one job queue for PromiseReactionJobs. An await continuation
// is a PromiseReactionJob like any other, so it takes its turn in FIFO order
// with the `then` callbacks queued around it -- never before them (it cannot
// run synchronously) and never nested inside one.
//
// Observed on the blocking build -- every await returned in place, and the
// `then2`/`then3` jobs had not run when the log was printed:
//   async:start async:after1 async:after2 async:after3 sync-end micro1 then1
//   microFromAsync micro2 microFromMicro2
//
// This suite's target links neither `queueMicrotask` nor `setTimeout`, so
// `Promise.resolve().then(f)` stands in for `queueMicrotask(f)` (same queue,
// same position). The `queueMicrotask` and timer half of the ordering lives in
// node-compat's `correctness/native/async-await-timers.ts`.
const log: string[] = []

function microtask(job: () => void): void {
  Promise.resolve().then(job)
}

microtask(() => log.push('micro1'))
Promise.resolve()
  .then(() => log.push('then1'))
  .then(() => log.push('then2'))
  .then(() => log.push('then3'))

const task = async (): Promise<void> => {
  log.push('async:start')
  await undefined
  log.push('async:after1')
  microtask(() => log.push('microFromAsync'))
  await undefined
  log.push('async:after2')
  await Promise.resolve()
  log.push('async:after3')
}
const done = task()

microtask(() => {
  log.push('micro2')
  microtask(() => log.push('microFromMicro2'))
})
log.push('sync-end')

done.then(() => {
  microtask(() => console.log(log.join(' ')))
})
//! expect: async:start sync-end micro1 then1 async:after1 micro2 then2 microFromAsync async:after2 microFromMicro2 then3 async:after3
