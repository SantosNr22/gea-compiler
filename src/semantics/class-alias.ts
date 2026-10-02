import ts from 'typescript'

import { unwrapErasedExpression } from './normalize/producers/erasure.js'

const classDeclarationOf = (checker: ts.TypeChecker, symbol: ts.Symbol): ts.ClassLikeDeclaration | null => {
  const resolved = (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol
  const declaration = resolved.valueDeclaration ?? resolved.declarations?.find((candidate) => ts.isClassLike(candidate))
  return declaration && ts.isClassLike(declaration) ? declaration : null
}

/**
 * A const whose initializer is a class value hidden only by type assertions.
 * The assertions allocate nothing and the const cannot change, so reading the
 * inner class preserves the runtime identity used by heritage and `super()`.
 */
export const transparentConstClassAliasTarget = (checker: ts.TypeChecker, node: ts.Expression): ts.Identifier | null => {
  if (!ts.isIdentifier(node)) return null
  const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration
  return declaration && ts.isVariableDeclaration(declaration) ? transparentClassAliasDeclarationTarget(checker, declaration) : null
}

/**
 * The same answer asked of the `const` DECLARATION itself, so the cell and
 * every reference to it name one class (`structural.ts`'s
 * `physical-class-alias` rule reads both through here).
 */
export const transparentClassAliasDeclarationTarget = (
  checker: ts.TypeChecker,
  declaration: ts.VariableDeclaration
): ts.Identifier | null => {
  if (!declaration.initializer) return null
  if (!ts.isVariableDeclarationList(declaration.parent) || (declaration.parent.flags & ts.NodeFlags.Const) === 0) return null
  const target = unwrapErasedExpression(declaration.initializer)
  if (!ts.isIdentifier(target)) return null
  const targetSymbol = checker.getSymbolAtLocation(target)
  return targetSymbol && classDeclarationOf(checker, targetSymbol) ? target : null
}

/** The class value evaluated by extends, shared by layout, ancestry and super. */
export const evaluatedClassHeritage = (checker: ts.TypeChecker, expression: ts.Expression): ts.Expression => {
  const value = unwrapErasedExpression(expression)
  return transparentConstClassAliasTarget(checker, value) ?? value
}
