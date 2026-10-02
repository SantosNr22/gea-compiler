/**
 * The intrinsic accessor getters a program can hold as function values
 * (`normalize/intrinsic-accessor-getter.ts` recognizes the reflective chains
 * that reach them). Carried on a `unary` computation's `operator`, so the IR
 * and the target read the same identity without any source text.
 */
export type IntrinsicAccessorGetter = 'TypedArray.prototype[@@toStringTag]'

const operatorPrefix = 'IntrinsicAccessorGetter:'

export const intrinsicAccessorGetterOperator = (getter: IntrinsicAccessorGetter): string => `${operatorPrefix}${getter}`

export const intrinsicAccessorGetterOfOperator = (operator: string): IntrinsicAccessorGetter | null =>
  operator === intrinsicAccessorGetterOperator('TypedArray.prototype[@@toStringTag]') ? 'TypedArray.prototype[@@toStringTag]' : null

export const intrinsicAccessorGetters: readonly IntrinsicAccessorGetter[] = ['TypedArray.prototype[@@toStringTag]']
