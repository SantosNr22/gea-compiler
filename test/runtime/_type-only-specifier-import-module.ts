// Helper module for type-only-specifier-import-does-not-evaluate.runtime.ts.
export interface Shape {
  readonly side: number
}
export class Square implements Shape {
  constructor(readonly side: number) {}
}
console.log('helper module evaluated')
