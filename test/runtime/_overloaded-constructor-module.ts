// Helper module for namespace-import-of-overloaded-constructor-class.runtime.ts.
export class Wide {
  readonly low: number
  readonly high: number
  constructor(low: number, high?: number, unsigned?: boolean)
  constructor(value: string, unsigned?: boolean)
  constructor(low: number | string, high?: number | boolean, unsigned?: boolean) {
    this.low = typeof low === 'string' ? Number(low) : low
    this.high = typeof high === 'number' ? high : 0
    if (unsigned) this.low = Math.abs(this.low)
  }
}
