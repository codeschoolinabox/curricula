import type { DataMode, MutatingOperatorEntry } from '../types.js';
import representValue from '../utils/represent-value.js';

type MutatingOperatorParameters = {
  readonly operator?: string;
  readonly target: string; // Variable name or property path
  readonly oldValue?: unknown;
  readonly newValue: unknown;
  readonly operand?: unknown; // For compound assignments (+=, -=, etc.)
};

/**
 * Factory for mutating operator step entries
 * Mutating operators change variable state (=, +=, -=, *=, /=, %=, ++, --, etc.)
 *
 * @param operator - The operator symbol
 * @param target - The variable name or property path being mutated
 * @param oldValue - The value before mutation (if applicable)
 * @param newValue - The value after mutation
 * @param operand - The right-hand operand for compound assignments
 * @returns Step entry object for a mutating operator
 */
function createMutatingOperator(
  {
    operator = '',
    target,
    oldValue,
    newValue,
    operand,
  }: MutatingOperatorParameters = {} as MutatingOperatorParameters,
  {
    data,
  }: {
    readonly data: DataMode;
  } = {} as { readonly data: DataMode },
): MutatingOperatorEntry {
  return {
    category: 'operator',
    kind: 'mutating',
    operator,
    target,
    newValue: representValue(newValue, data),
    ...(oldValue !== undefined && { oldValue: representValue(oldValue, data) }),
    ...(operand !== undefined && { operand: representValue(operand, data) }),
  };
}

export default createMutatingOperator;
