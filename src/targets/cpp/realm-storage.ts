import type { DeclarationId } from '../../identity/ids.js'
import type { BindingPlacement } from '../../projection/bindings.js'
import { cppGlobalName } from './types.js'

// The build states which program is an independently instantiated agent. Every
// body consumes that same storage decision, including optimized array windows.
const realmPrograms = new WeakSet<ReadonlyMap<DeclarationId, BindingPlacement>>()

export const publishRealmStorage = (placements: ReadonlyMap<DeclarationId, BindingPlacement>, enabled: boolean): void => {
  if (enabled) realmPrograms.add(placements)
  else realmPrograms.delete(placements)
}

export const realmBindingName = (placements: ReadonlyMap<DeclarationId, BindingPlacement>, declaration: DeclarationId): string =>
  `${cppGlobalName(declaration)}${realmPrograms.has(placements) ? '()' : ''}`

export const usesRealmStorage = (placements: ReadonlyMap<DeclarationId, BindingPlacement>): boolean => realmPrograms.has(placements)
