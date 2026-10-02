//! compile-only
//! emitted-has: phase

// Forty drawing methods on one shared store, each reading the store's cells and
// calling two others, so the method-call graph is one strongly connected
// component. Three components call them per list row. The member-closure proof
// must answer once per method, not once per path of parked methods into the
// cycle (2^40); `test/proof-memo-store-methods.mjs` bounds the work.
import { Component, Store } from '@geastack/core'

class Wheel extends Store {
  phase = 0
  level = 0
  spokes = [0, 1, 2, 3, 4, 5]

  m0(index: number): number {
    const base = Math.sin(this.phase * 1 + index) * this.level
    return Math.round(base + this.m1(index) * 0.01 + this.m7(index) * 0.01)
  }

  m1(index: number): number {
    const base = Math.sin(this.phase * 2 + index) * this.level
    return Math.round(base + this.m2(index) * 0.01 + this.m8(index) * 0.01)
  }

  m2(index: number): number {
    const base = Math.sin(this.phase * 3 + index) * this.level
    return Math.round(base + this.m3(index) * 0.01 + this.m9(index) * 0.01)
  }

  m3(index: number): number {
    const base = Math.sin(this.phase * 4 + index) * this.level
    return Math.round(base + this.m4(index) * 0.01 + this.m10(index) * 0.01)
  }

  m4(index: number): number {
    const base = Math.sin(this.phase * 5 + index) * this.level
    return Math.round(base + this.m5(index) * 0.01 + this.m11(index) * 0.01)
  }

  m5(index: number): number {
    const base = Math.sin(this.phase * 6 + index) * this.level
    return Math.round(base + this.m6(index) * 0.01 + this.m12(index) * 0.01)
  }

  m6(index: number): number {
    const base = Math.sin(this.phase * 7 + index) * this.level
    return Math.round(base + this.m7(index) * 0.01 + this.m13(index) * 0.01)
  }

  m7(index: number): number {
    const base = Math.sin(this.phase * 8 + index) * this.level
    return Math.round(base + this.m8(index) * 0.01 + this.m14(index) * 0.01)
  }

  m8(index: number): number {
    const base = Math.sin(this.phase * 9 + index) * this.level
    return Math.round(base + this.m9(index) * 0.01 + this.m15(index) * 0.01)
  }

  m9(index: number): number {
    const base = Math.sin(this.phase * 10 + index) * this.level
    return Math.round(base + this.m10(index) * 0.01 + this.m16(index) * 0.01)
  }

  m10(index: number): number {
    const base = Math.sin(this.phase * 11 + index) * this.level
    return Math.round(base + this.m11(index) * 0.01 + this.m17(index) * 0.01)
  }

  m11(index: number): number {
    const base = Math.sin(this.phase * 12 + index) * this.level
    return Math.round(base + this.m12(index) * 0.01 + this.m18(index) * 0.01)
  }

  m12(index: number): number {
    const base = Math.sin(this.phase * 13 + index) * this.level
    return Math.round(base + this.m13(index) * 0.01 + this.m19(index) * 0.01)
  }

  m13(index: number): number {
    const base = Math.sin(this.phase * 14 + index) * this.level
    return Math.round(base + this.m14(index) * 0.01 + this.m20(index) * 0.01)
  }

  m14(index: number): number {
    const base = Math.sin(this.phase * 15 + index) * this.level
    return Math.round(base + this.m15(index) * 0.01 + this.m21(index) * 0.01)
  }

  m15(index: number): number {
    const base = Math.sin(this.phase * 16 + index) * this.level
    return Math.round(base + this.m16(index) * 0.01 + this.m22(index) * 0.01)
  }

  m16(index: number): number {
    const base = Math.sin(this.phase * 17 + index) * this.level
    return Math.round(base + this.m17(index) * 0.01 + this.m23(index) * 0.01)
  }

  m17(index: number): number {
    const base = Math.sin(this.phase * 18 + index) * this.level
    return Math.round(base + this.m18(index) * 0.01 + this.m24(index) * 0.01)
  }

  m18(index: number): number {
    const base = Math.sin(this.phase * 19 + index) * this.level
    return Math.round(base + this.m19(index) * 0.01 + this.m25(index) * 0.01)
  }

  m19(index: number): number {
    const base = Math.sin(this.phase * 20 + index) * this.level
    return Math.round(base + this.m20(index) * 0.01 + this.m26(index) * 0.01)
  }

  m20(index: number): number {
    const base = Math.sin(this.phase * 21 + index) * this.level
    return Math.round(base + this.m21(index) * 0.01 + this.m27(index) * 0.01)
  }

  m21(index: number): number {
    const base = Math.sin(this.phase * 22 + index) * this.level
    return Math.round(base + this.m22(index) * 0.01 + this.m28(index) * 0.01)
  }

  m22(index: number): number {
    const base = Math.sin(this.phase * 23 + index) * this.level
    return Math.round(base + this.m23(index) * 0.01 + this.m29(index) * 0.01)
  }

  m23(index: number): number {
    const base = Math.sin(this.phase * 24 + index) * this.level
    return Math.round(base + this.m24(index) * 0.01 + this.m30(index) * 0.01)
  }

  m24(index: number): number {
    const base = Math.sin(this.phase * 25 + index) * this.level
    return Math.round(base + this.m25(index) * 0.01 + this.m31(index) * 0.01)
  }

  m25(index: number): number {
    const base = Math.sin(this.phase * 26 + index) * this.level
    return Math.round(base + this.m26(index) * 0.01 + this.m32(index) * 0.01)
  }

  m26(index: number): number {
    const base = Math.sin(this.phase * 27 + index) * this.level
    return Math.round(base + this.m27(index) * 0.01 + this.m33(index) * 0.01)
  }

  m27(index: number): number {
    const base = Math.sin(this.phase * 28 + index) * this.level
    return Math.round(base + this.m28(index) * 0.01 + this.m34(index) * 0.01)
  }

  m28(index: number): number {
    const base = Math.sin(this.phase * 29 + index) * this.level
    return Math.round(base + this.m29(index) * 0.01 + this.m35(index) * 0.01)
  }

  m29(index: number): number {
    const base = Math.sin(this.phase * 30 + index) * this.level
    return Math.round(base + this.m30(index) * 0.01 + this.m36(index) * 0.01)
  }

  m30(index: number): number {
    const base = Math.sin(this.phase * 31 + index) * this.level
    return Math.round(base + this.m31(index) * 0.01 + this.m37(index) * 0.01)
  }

  m31(index: number): number {
    const base = Math.sin(this.phase * 32 + index) * this.level
    return Math.round(base + this.m32(index) * 0.01 + this.m38(index) * 0.01)
  }

  m32(index: number): number {
    const base = Math.sin(this.phase * 33 + index) * this.level
    return Math.round(base + this.m33(index) * 0.01 + this.m39(index) * 0.01)
  }

  m33(index: number): number {
    const base = Math.sin(this.phase * 34 + index) * this.level
    return Math.round(base + this.m34(index) * 0.01 + this.m0(index) * 0.01)
  }

  m34(index: number): number {
    const base = Math.sin(this.phase * 35 + index) * this.level
    return Math.round(base + this.m35(index) * 0.01 + this.m1(index) * 0.01)
  }

  m35(index: number): number {
    const base = Math.sin(this.phase * 36 + index) * this.level
    return Math.round(base + this.m36(index) * 0.01 + this.m2(index) * 0.01)
  }

  m36(index: number): number {
    const base = Math.sin(this.phase * 37 + index) * this.level
    return Math.round(base + this.m37(index) * 0.01 + this.m3(index) * 0.01)
  }

  m37(index: number): number {
    const base = Math.sin(this.phase * 38 + index) * this.level
    return Math.round(base + this.m38(index) * 0.01 + this.m4(index) * 0.01)
  }

  m38(index: number): number {
    const base = Math.sin(this.phase * 39 + index) * this.level
    return Math.round(base + this.m39(index) * 0.01 + this.m5(index) * 0.01)
  }

  m39(index: number): number {
    const base = Math.sin(this.phase * 40 + index) * this.level
    return Math.round(base + this.m0(index) * 0.01 + this.m6(index) * 0.01)
  }
}

const wheel = new Wheel()

class Face0 extends Component {
  template(): JSX.Element {
    return (
      <view>
        {wheel.spokes.map((spoke) => (
          <view
            key={spoke}
            style={{
              left: wheel.m0(spoke),
              top: wheel.m7(spoke),
              width: wheel.m14(spoke),
              height: wheel.m21(spoke),
              opacity: wheel.m28(spoke)
            }}
          />
        ))}
      </view>
    )
  }
}

class Face1 extends Component {
  template(): JSX.Element {
    return (
      <view>
        {wheel.spokes.map((spoke) => (
          <view
            key={spoke}
            style={{
              left: wheel.m13(spoke),
              top: wheel.m20(spoke),
              width: wheel.m27(spoke),
              height: wheel.m34(spoke),
              opacity: wheel.m1(spoke)
            }}
          />
        ))}
      </view>
    )
  }
}

class Face2 extends Component {
  template(): JSX.Element {
    return (
      <view>
        {wheel.spokes.map((spoke) => (
          <view
            key={spoke}
            style={{
              left: wheel.m26(spoke),
              top: wheel.m33(spoke),
              width: wheel.m0(spoke),
              height: wheel.m7(spoke),
              opacity: wheel.m14(spoke)
            }}
          />
        ))}
      </view>
    )
  }
}

const tree = (
  <view>
    <Face0 />
    <Face1 />
    <Face2 />
  </view>
)
void tree
