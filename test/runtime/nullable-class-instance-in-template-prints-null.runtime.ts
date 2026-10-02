// A `Job | null` interpolated into a template literal prints `null` when it
// holds null, not the object text the class arm would print.

class Job {
  readonly id: number
  constructor(id: number) {
    this.id = id
  }
}

const pick = (jobs: Job[], index: number): Job | null => (index < jobs.length ? jobs[index]! : null)

const jobs = [new Job(1)]
//! expect: first=[object Object] missing=null
console.log(`first=${pick(jobs, 0)} missing=${pick(jobs, 5)}`)
