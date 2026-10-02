//! expect-refusal: native-boundary:Function.prototype

// The static half of a guarded `bind` (`emit-callable.ts`'s
// `guardedBindLines`) rests on this refusal. A native `this.log.bind(this)`
// behind a run-time own-`bind` check is exact only while `Function.prototype.bind`
// is the intrinsic, and this runtime has no `Function.prototype` table a
// program can write: the replacement below is refused by name at certification
// rather than compiled into a program where node would print `replaced:1`
// and the native bind would silently not. If this ever certifies, the guard
// needs its second, run-time half.

let calls = 0
const original = Function.prototype.bind
Function.prototype.bind = function (this: Function, thisArg: unknown, ...args: unknown[]): any {
  calls += 1
  return original.apply(this, [thisArg, ...args])
}

class Logger {
  warn: (message: string) => void

  constructor() {
    this.warn = this.log.bind(this, 'warn')
  }

  private log(severity: string, message: string): void {
    console.log(severity + ':' + message + ' replaced:' + calls)
  }
}

new Logger().warn('disk low')
