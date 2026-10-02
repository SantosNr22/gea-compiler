//! compile-only
//! emitted-has: ::items__rev, gea_apply);
import { Component, Store } from '@geastack/core'

class Items extends Store {
  items = [1, 2]
}
const state = new Items()
class List extends Component {
  template(): JSX.Element {
    return (
      <view>
        {state.items.map((item) => {
          const label = 'item ' + item
          return <view>{label}</view>
        })}
      </view>
    )
  }
}
const tree = <List />
void tree
