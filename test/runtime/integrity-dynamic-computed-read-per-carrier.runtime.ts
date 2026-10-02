// A computed read off a dynamically typed value (`bag[key]`) can only reach
// `Object.freeze` if the value is `Object`, which this program never lets
// escape its member reads. The freeze of one record shape must therefore keep
// guarding that shape alone: the class's stores stay plain and the frozen
// record still refuses.
'use strict'
class Frame {
  index = 0
}
interface Settings {
  level: number
}

const bag: any = JSON.parse('{"a":1,"freeze":2}')
const pick = (key: string): unknown => bag[key]
const settings: Settings = { level: 1 }
Object.freeze(settings)
const step = (frame: Frame): void => {
  frame.index = frame.index + 1
}
const frame = new Frame()
step(frame)
step(frame)
let refused = false
try {
  settings.level = 2
} catch (error) {
  refused = error instanceof TypeError
}
console.log(pick('a'), pick('freeze'), frame.index, refused, settings.level)

//! expect: 1 2 2 true 1
