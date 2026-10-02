//! expect: shadowed:warn disk low
//! expect: info:ready
//! emitted-has: gea::callableBindIsIntrinsic

// The other side of `bind-stays-builtin-when-a-computed-write-cannot-reach-
// the-function`: here the logger itself is handed to an `any` parameter, so a
// computed write through that box CAN land on `log`'s Function object -- node
// prints `shadowed:warn`, because `this.log.bind` is then the program's own
// function. The reflection census sees the boxed instance and cannot confirm
// the builtin statically, so the bind is lowered natively behind a run-time
// check of the Function object's own `bind`: `Logger`'s method was patched
// and the program's `bind` answers, `Status`'s was boxed the same way but
// never patched and the native bound callable answers.

class Logger {
  warn: (message: string) => void

  constructor() {
    patch(this, 'log')
    this.warn = this.log.bind(this, 'warn')
  }

  private log(severity: string, message: string): void {
    console.log(severity + ':' + message)
  }
}

class Status {
  info: (message: string) => void

  constructor() {
    inspect(this, 'report')
    this.info = this.report.bind(this, 'info')
  }

  private report(severity: string, message: string): void {
    console.log(severity + ':' + message)
  }
}

function patch(target: any, method: string): void {
  const fn = target[method]
  const key = 'bind'
  fn[key] = (_self: unknown, severity: string) => (message: string) => console.log('shadowed:' + severity + ' ' + message)
}

function inspect(target: any, method: string): void {
  if (typeof target[method] !== 'function') console.log('missing ' + method)
}

new Logger().warn('disk low')
new Status().info('ready')
