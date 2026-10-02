// A hoisted function declaration whose identity the program compares
// (`off(errorHandler)`) is built as an identified callable and then written
// into its own cell. That write MOVES: the callable is dying there. The
// program still sees one function object -- `off` finds the handler `on`
// installed, and the closures keep sharing their captured cells.
'use strict'
class Emitter {
  handlers: Array<(e: Error) => void> = []
  on(h: (e: Error) => void): void {
    this.handlers.push(h)
  }
  off(h: (e: Error) => void): void {
    this.handlers = this.handlers.filter((x) => x !== h)
  }
}

function setup(emitter: Emitter, tag: string): () => void {
  let error: Error | null = null
  let finished = false
  emitter.on(errorHandler)
  return () => {
    errorHandler(new Error('boom'))
  }
  function errorHandler(e: Error) {
    error = e
    closeHandler()
  }
  function closeHandler() {
    finished = true
    const before = emitter.handlers.length
    emitter.off(errorHandler)
    console.log(tag, error?.message, finished, before, emitter.handlers.length)
  }
}

const emitter = new Emitter()
const first = setup(emitter, 'a')
const second = setup(emitter, 'b')
first()
second()
//! expect: a boom true 2 1
//! expect: b boom true 1 0
export {}
