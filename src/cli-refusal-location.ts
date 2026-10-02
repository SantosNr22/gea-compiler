import type { CompilationResult } from './compiler.js'
import type { SemanticResultId } from './identity/ids.js'
import { nodeOfOperation, operationOfResult } from './identity/ids.js'

export const refusalSourceLocation = (
  result: CompilationResult,
  refusal: { readonly owner: string; readonly lineage?: SemanticResultId }
): string => {
  const location = refusal.lineage === undefined ? null : result.locationOfNode(nodeOfOperation(operationOfResult(refusal.lineage)))
  return location === null ? refusal.owner : `${location.file}:${location.line}:${location.column}`
}
