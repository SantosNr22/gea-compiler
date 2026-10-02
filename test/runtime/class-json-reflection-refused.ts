//! expect-refusal: host-member-call:JSON.stringify
class JsonBundle {
  first = 1
  second = 'two'
}

class WiderBundle extends JsonBundle {
  third = true
}

// JSON.stringify of a class instance is a native writer over the instance's
// own fields (`json-stringify-class-own-fields.ts`), chosen by the carrier's
// static class. A carrier typed as a class something EXTENDS may hold a
// subclass instance with more own properties than its static class lists --
// node prints {"first":1,"second":"two","third":true} for the second call --
// and until the writer dispatches on the instance's own class, the compiler
// refuses rather than print the base's fields for it.
function show(bundle: JsonBundle): void {
  console.log(JSON.stringify(bundle))
}
show(new JsonBundle())
show(new WiderBundle())
