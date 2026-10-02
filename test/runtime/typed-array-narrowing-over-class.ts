//! expect-refusal: no runtime conversion is installed from class-ref(decl|f168|1,shared-refcount) to optional(tagged-union
// `@hono/node-server` listener.ts `responseViaCache`, line 192 -- PINNED AS A
// REFUSAL AGAIN (2026-09-23). node prints `null` / `str:hi` /
// `stream:reader`. The `instanceof Uint8Array` test over a `gea::Ref<StreamLite>`
// settles `false` at emission, so the branch never runs -- but its `end(body)`
// argument was still admitted by `staticRecipe`'s `view:boxed-assertion`
// fallback, which boxed the class instance and dispatched the box over
// `string | Uint8Array`: a conversion no arm can ever take, i.e. a certain
// abort, certified because it happened to sit in dead code. The same fallback
// certified that abort on LIVE argument passing too
// (`typed-object-into-union-with-no-recast.runtime.ts`), so it now admits only
// a box some arm can read back, and this dead site is the missing conversion
// it always was. Compiling it again needs the IR to know the branch is dead
// (the settled instanceof), not a conversion that pretends to exist.
//
// `InternalCache[1]` is declared `string | ReadableStream | null`, and the
// function still asks `body instanceof Uint8Array`: hono stores a whole
// `BodyInit` through an `any`-typed symbol expando and reads it back with an
// unchecked `as InternalCache`, so the declared type is narrower than what the
// slot holds. TypeScript cannot discard the arm, so the branch's type is
// `ReadableStream & Uint8Array`.
//
// Both carriers for that intersection refuse, in different places, and the
// refusal is correct either way:
//   - the nominal class (today's answer) carries the branch, and passing it to
//     `end(chunk?: string | Uint8Array)` has no `class-ref -> optional(string |
//     uint8)` conversion;
//   - letting the typed array outrank the nominal class in `deriveIntersection`
//     (tried, measured, reverted) only moves the refusal one node earlier, onto
//     the narrowing itself: `optional(string | class-ref, null)` is physically a
//     string or a `gea::Ref<StreamLite>` and there is no Uint8Array inside it to
//     narrow to.
//
// The value really is a Uint8Array at runtime, so proving the `instanceof`
// false and pruning the branch would be a silent miscompile of every binary
// response. The honest repair is upstream of this compiler -- `InternalCache`
// has to admit what hono puts in it -- so the refusal stands and is pinned here.
class StreamLite {
  getReader(): string {
    return 'reader'
  }
}

type CachedBody = string | StreamLite | null

const end = (chunk?: string | Uint8Array): string =>
  chunk === undefined ? 'end' : typeof chunk === 'string' ? `end:${chunk}` : `end:${chunk.byteLength}`

const write = (body: CachedBody): string => {
  if (body === null) return 'null'
  if (typeof body === 'string') return `str:${body}`
  if (body instanceof Uint8Array) return end(body)
  return `stream:${body.getReader()}`
}

console.log(write(null))
console.log(write('hi'))
console.log(write(new StreamLite()))
