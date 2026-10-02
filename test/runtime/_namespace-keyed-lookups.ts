// Helper module for namespace-read-under-closed-key-selects-export.runtime.ts.
export async function resolveSrv(name: string): Promise<string[]> {
  return ['srv:' + name]
}
export async function resolveTxt(name: string): Promise<string[]> {
  return ['txt:' + name]
}
export async function resolveMx(name: string): Promise<string[]> {
  return ['mx:' + name]
}
