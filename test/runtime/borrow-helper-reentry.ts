//! expect: before after
//! emitted-lacks: _stable_borrow(v

class Holder {
  text = 'before'
}
function mutate(holder: Holder): number {
  holder.text = 'after'
  return 1
}
function middle(holder: Holder): number {
  return mutate(holder)
}
function snapshot(text: string, holder: Holder): string {
  middle(holder)
  return text
}
const holder = new Holder()
console.log(snapshot(holder.text, holder), holder.text)
