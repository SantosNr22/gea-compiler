// A symbol-keyed non-writable definition onto a dynamically typed target
// restricts only symbol-keyed properties: a declared string-named field of the
// same object stays writable, and the symbol property itself stays read-only.
'use strict'
const kTag = Symbol('tag')
class Frame {
  index = 0
}
const mark = (target: any): void => {
  Object.defineProperty(target, kTag, { value: 1, writable: false, configurable: true, enumerable: false })
}
const frame = new Frame()
mark(frame)
frame.index = 3
let refused = false
try {
  ;(frame as any)[kTag] = 2
} catch (error) {
  refused = error instanceof TypeError
}
console.log(frame.index, refused, (frame as any)[kTag])

//! expect: 3 true 1
