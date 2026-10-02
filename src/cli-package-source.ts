import { isAbsolute } from 'node:path'
import { createPackageSourceHost } from './semantics/package-sources.js'

// A module-graph build and ordinary module resolution must use the same package
// metadata authority. Keeping a second exports-only resolver here lost published
// declaration maps and compiled bundled JS even when the original TS was shipped.
const sources = createPackageSourceHost()

export const packageSourceFor = (target: string): string | null => {
  if (!isAbsolute(target)) return null
  const source = sources.sourceOf(target)
  return source === target ? null : source
}
