// `hasAspect`'s read without `defineAspects`: a class's static field written
// by plain assignment on one subclass, read back through
// `this.constructor as { aspects?: Set<symbol> }`. The read names whichever
// class the instance was built by, and a subclass that never wrote the field
// sees its nearest base's.
const READ = Symbol('READ')
const RETRY = Symbol('RETRY')

abstract class AbstractOperation {
  static aspects?: Set<symbol>
  hasAspect(aspect: symbol): boolean {
    const ctor = this.constructor as { aspects?: Set<symbol> }
    if (ctor.aspects == null) return false
    return ctor.aspects.has(aspect)
  }
}

class AggregateOperation extends AbstractOperation {}
class CountOperation extends AggregateOperation {}
class PingOperation extends AbstractOperation {}
class DropOperation extends AbstractOperation {}

AggregateOperation.aspects = new Set([READ, RETRY])
PingOperation.aspects = new Set([READ])

const report = (operation: AbstractOperation): string => `${operation.hasAspect(READ)}/${operation.hasAspect(RETRY)}`
console.log(report(new AggregateOperation()), report(new CountOperation()), report(new PingOperation()), report(new DropOperation()))
console.log(CountOperation.aspects?.size, PingOperation.aspects?.size, DropOperation.aspects === undefined)
//! expect: true/true true/true true/false false/false
//! expect: 2 1 true
