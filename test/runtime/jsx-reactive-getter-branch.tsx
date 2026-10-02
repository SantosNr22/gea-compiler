//! compile-only
//! emitted-has: gea::jsx::reactiveNodeApply(
//! emitted-has: ::phase, gea_apply);

// The computed predicate itself contains no control-flow branch. Its returned
// boolean still determines which subtree exists, so phase must be subscribed.
import { Component, Store } from '@geastack/core'

class Agent extends Store {
  phase = 'idle'

  get speaking(): boolean {
    return this.phase === 'speaking'
  }
}

const agent = new Agent()

class App extends Component {
  template(): JSX.Element {
    return <view>{agent.speaking ? <view id="voice" /> : <view id="scanner" />}</view>
  }
}

const tree: JSX.Element = <App />
