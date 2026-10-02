//! compile-only
//! emitted-has: gea::CallableObject<void(gea::framework::events::PointerEvent)>
//! emitted-has: .getAttribute("value")
import { Component } from '@geastack/core'

class Editor extends Component {
  value = ''
  template(): JSX.Element {
    return (
      <input
        onInput={(event: { target: { value: string } }) => {
          this.value = event.target.value
        }}
      />
    )
  }
}
const tree = <Editor />
void tree
