// three's `ColorBuffer.setClear( r, g, b, a, premultipliedAlpha )`, with the
// `@param {boolean} premultipliedAlpha` statement the `@types/three` overlay
// carries into three's own source: required in the statement, yet WebGLState
// itself calls `colorBuffer.setClear( 0, 0, 0, 1 )` without it. The binding is
// `boolean | undefined` (`omitted-stated-parameter.ts`); a read must keep that
// absence, because the checker's `boolean` at the read is the statement, not a
// narrowing. `undefined === true` is false -- the comparison tests presence and
// must never require it.

export {}

function ColorBuffer() {
  const seen = []
  return {
    seen,
    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @param {boolean} premultipliedAlpha
     */
    setClear: function (r, g, b, a, premultipliedAlpha) {
      if (premultipliedAlpha === true) {
        r *= a
        g *= a
        b *= a
      }
      seen.push(r + ',' + g + ',' + b + ',' + a)
    }
  }
}

function WebGLState() {
  // @ts-ignore -- three constructs its factory functions with `new`
  const colorBuffer = new ColorBuffer()
  // @ts-ignore -- three omits the statement's required argument here
  colorBuffer.setClear(0, 0, 0, 1)
  return { buffers: { color: colorBuffer } }
}

/** @param {{ buffers: { color: ReturnType<typeof ColorBuffer> } }} state @param {boolean} premultipliedAlpha */
function WebGLBackground(state, premultipliedAlpha) {
  return {
    render: function () {
      state.buffers.color.setClear(1, 1, 1, 0.5, premultipliedAlpha)
    }
  }
}

// @ts-ignore -- three constructs its factory functions with `new`
const state = new WebGLState()
// @ts-ignore
new WebGLBackground(state, true).render()
//! expect: 0,0,0,1 0.5,0.5,0.5,0.5
console.log(state.buffers.color.seen.join(' '))
