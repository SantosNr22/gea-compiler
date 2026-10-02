//! expect-refusal: no runtime conversion is installed from class-ref(decl|f168|1,shared-refcount) to tagged-union(0:carrier:string|1:carrier:native-record-ref(
// A TYPED OBJECT INTO A UNION IT SATISFIES, WITH NO RECAST TO ANY ARM.
//
// `Countdown` is an `ArrayLike<number>` to TypeScript, so node prints
// `first 3 of 3` / `text go`. This backend has no view from the class into
// lib's `ArrayLike` record, and `staticRecipe`'s last resort used to admit
// the pair anyway as `view:boxed-assertion`: box the instance into a
// `gea::Value`, then dispatch the box over the union's arms. The dispatch
// matches an arm by the box's recorded C++ payload type, and a
// `gea::Ref<Countdown>` is neither `std::string` nor the `ArrayLike` record,
// so no arm could ever take it -- the program certified, compiled, and
// aborted on every call with "a dynamic value admitted by no union arm".
//
// `boxLandsInAnArm` (emit-narrowing.ts) now admits the box only where some
// arm's own discriminant can match it, or the union has a dynamic remainder,
// so the missing conversion is the certify row it always was.

class Countdown {
  readonly length = 3;
  [index: number]: number
  constructor() {
    this[0] = 3
    this[1] = 2
    this[2] = 1
  }
}

function first(values: string | ArrayLike<number>): string {
  return typeof values === 'string' ? `text ${values}` : `first ${values[0]} of ${values.length}`
}

console.log(first(new Countdown()))
console.log(first('go'))
