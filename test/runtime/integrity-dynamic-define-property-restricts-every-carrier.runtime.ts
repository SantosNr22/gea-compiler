// A `defineProperty` onto a dynamically typed target can name any declared
// field of any struct, so a non-writable string-keyed definition keeps the
// store guard on every carrier: the class instance below must refuse its write.
'use strict'
class Frame {
  index = 0
}
const lock = (target: any, name: string): void => {
  Object.defineProperty(target, name, { value: 5, writable: false })
}
const frame = new Frame()
lock(frame, 'index')
let refused = false
try {
  frame.index = 1
} catch (error) {
  refused = error instanceof TypeError
}
console.log(refused, frame.index)

//! expect: true 5
