// Helper module for namespace-read-under-closed-key-selects-export.runtime.ts:
// two exports of different result types, like node's `createCipheriv` /
// `createDecipheriv`, and a re-exported namespace whose members share one
// convention, like node-compat's `dns.promises`.
import * as lookups from './_namespace-keyed-lookups'
export { lookups }

export class Cipher {
  constructor(readonly mode: string) {}
  update(input: string): string {
    return 'enc(' + this.mode + ':' + input + ')'
  }
}
export class Decipher {
  constructor(readonly mode: string) {}
  update(input: string): string {
    return 'dec(' + this.mode + ':' + input + ')'
  }
}
export function createCipheriv(mode: string): Cipher {
  return new Cipher(mode)
}
export function createDecipheriv(mode: string): Decipher {
  return new Decipher(mode)
}
