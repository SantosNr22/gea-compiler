/// <reference types="node" />

export = Bits

declare const Bits: Bits

interface Bits {
  (options?: Bits.Options): Bits.Instance
  new (options?: Bits.Options): Bits.Instance
}

declare namespace Bits {
  interface Options {
    size?: number | undefined
  }
  interface Instance {
    get(index: number): boolean
  }
}
