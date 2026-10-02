//! expect-refusal: merged enum declarations require shared conditional object initialization

enum State {
  First = 1
}
enum State {
  Last = 2
}
console.log(State.First, State.Last)
