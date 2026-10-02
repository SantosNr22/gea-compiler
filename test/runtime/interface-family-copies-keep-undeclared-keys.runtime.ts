// Copies into and out of an interface family's one layout, whose struct holds
// the union of every member's fields:
//  - `Object.assign` from a family view copies a field the target's type does
//    not declare into the target's sidecar (the object may be a wider member);
//  - a spread key the literal overwrites right after is never stored, even
//    when the source carries it in a shape the literal's slot does not take;
//  - a spread key only ANOTHER family member types (`id` below) widens that
//    member's slot to hold what the spread stores there.
// Key ORDER is not checked: a family-typed literal enumerates in the family
// layout's order, not its own creation order (a standing gap).
interface BaseOptions {
  raw?: boolean
}
interface CommandOptions extends BaseOptions {
  comment?: string
  validation?: { utf8: boolean }
}
interface SessionOptions extends BaseOptions {
  id?: { hex: string }
}
const session: SessionOptions = { id: { hex: 'ab' } }
interface ConnectOptions {
  id: number | 'monitor'
  raw?: boolean
  validation?: { utf8: string }
}
interface Target {
  raw?: boolean
  host: string
}

function assignFrom(options: BaseOptions): Target & BaseOptions {
  return Object.assign({ host: 'h' }, options)
}
const command: CommandOptions = { raw: true, comment: 'hi' }
const assigned = assignFrom(command)
console.log(assigned.host, assigned.raw, JSON.stringify(assigned))

const connect: ConnectOptions = { id: 7, raw: true, validation: { utf8: 'x' } }
const handshake: CommandOptions = { ...connect, raw: false, validation: { utf8: true } }
console.log(handshake.raw, handshake.validation?.utf8, Object.keys(handshake).sort().join(','), (handshake as { id?: unknown }).id)
console.log(session.id?.hex)
//! expect: h true {"host":"h","raw":true,"comment":"hi"}
//! expect: false true id,raw,validation 7
//! expect: ab
export {}
