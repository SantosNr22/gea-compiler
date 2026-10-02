// The three live-instance re-parents with no sound native answer, each
// refused by name rather than rendered as a no-op that would keep the old
// methods (`ir/instance-reparenting.ts`):
//
// - the target class adds a field, so the object allocated as the base is
//   smaller than an instance of the target;
// - the instance's class is not a base of the target's, so the target's
//   methods would read storage the object does not have;
// - the new prototype is not a class's own `.prototype` read, so which class
//   the object becomes is not known at compile time.
//
// Under node this prints wider=1, other=true, open=true.
//
//! expect-refusal: declares instance field(s) extra
//! expect-refusal: is not a base of the prototype's class
//! expect-refusal: is not a class's own .prototype read
class Base {
  value = 1
  read(): number {
    return this.value
  }
}

class Wider extends Base {
  extra = 2
  read(): number {
    return this.value + this.extra
  }
}

class Unrelated {
  value = 5
  read(): number {
    return this.value
  }
}

const pick = (flag: boolean): Base => (flag ? Wider.prototype : Base.prototype)

// One function per case: a refusal is reported once per body and key.
function widerCase(): void {
  const wider = new Base()
  Object.setPrototypeOf(wider, Wider.prototype)
  console.log('wider=' + (wider.read() === 3 ? 3 : 1))
}

function otherCase(): void {
  const other = new Unrelated()
  Object.setPrototypeOf(other, Base.prototype)
  console.log('other=' + (other instanceof Base))
}

function openCase(): void {
  const opened = new Base()
  Object.setPrototypeOf(opened, pick(true))
  console.log('open=' + (opened instanceof Wider))
}

widerCase()
otherCase()
openCase()
