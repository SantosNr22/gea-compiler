// Helper module for namespace-member-through-reexported-namespace.runtime.ts.
export const onDemand = { twice: (n: number): number => n * 2 }
export function serialize(n: number): number {
  return n + 1
}
export const TIMEOUT = 'ETIMEOUT'
