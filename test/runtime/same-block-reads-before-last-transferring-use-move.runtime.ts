// A record read in place several times and handed over once, all in ONE block
// (`a = cmd.find; b = cmd.i; new Req(cmd)`), moves at the handover: every read
// before it is placed ahead of the move whatever the scheduler withholds. A read
// AFTER the handover in the same block keeps the copy.
'use strict'
class Req {
  command: Record<string, unknown>
  n: number
  constructor(command: Record<string, unknown>) {
    this.command = command
    this.n = 1
  }
}
const early = (i: number): string => {
  const cmd: Record<string, unknown> = { find: 'x', i }
  const a = cmd.find
  const b = cmd.i
  const r = new Req(cmd)
  return String(a) + String(b) + String(r.n) + String(r.command.i)
}
const late = (i: number): string => {
  const cmd: Record<string, unknown> = { find: 'y', i }
  const a = cmd.find
  const r = new Req(cmd)
  const b = cmd.i
  return String(a) + String(b) + String(r.n)
}
console.log(early(4) + ' ' + late(5))
//! expect: x414 y51
