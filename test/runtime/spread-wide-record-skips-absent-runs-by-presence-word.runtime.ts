// A wide options record spread into a record of its own type: the static copy
// skips runs of absent fields by a word test of their presence bits, so every
// position -- first and last of a run, the ragged tail past the last full
// run, a field present only as an explicit undefined -- must still arrive.
type Wide = {
  f0?: number
  f1?: number
  f2?: number
  f3?: number
  f4?: number
  f5?: number
  f6?: number
  f7?: number
  f8?: number
  f9?: number
  f10?: number
  f11?: number
  f12?: number
  f13?: number
  f14?: number
  f15?: number
  f16?: number
  f17?: number
  f18?: number
  f19?: number
  f20?: number
  f21?: number
  f22?: number
  f23?: number
  f24?: number
  f25?: number
}
function make(keys: readonly string[]): Wide {
  const w: Wide = {}
  for (const k of keys) (w as Record<string, number | undefined>)[k] = k === 'f12' ? undefined : Number(k.slice(1))
  return w
}
const picks = [['f0'], ['f7', 'f8'], ['f15', 'f16', 'f23'], ['f24', 'f25'], ['f12', 'f3'], ['f25', 'f0', 'f9']]
for (const pick of picks) {
  const source = make(pick)
  const copy: Wide = { ...source }
  console.log(Object.keys(copy).join(','), JSON.stringify(copy))
}
//! expect: f0 {"f0":0}
//! expect: f7,f8 {"f7":7,"f8":8}
//! expect: f15,f16,f23 {"f15":15,"f16":16,"f23":23}
//! expect: f24,f25 {"f24":24,"f25":25}
//! expect: f12,f3 {"f3":3}
//! expect: f25,f0,f9 {"f25":25,"f0":0,"f9":9}
