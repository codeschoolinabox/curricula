import type { DataMode, ShortCircuitingOperatorEntry } from '../types.js';
import representValue from '../utils/represent-value.js';

type ShortCircuitingOperatorParameters = {
  readonly operator?: string;
  readonly left: unknown;
  readonly right?: unknown;
  readonly result: unknown;
  readonly rightEvaluated: boolean;
};

/**
 * Factory for short-circuiting operator step entries
 * Short-circuiting operators may skip evaluating the right operand based on the left operand
 * (&&, ||, ??, ?:)
 *
 * @param operator - The operator symbol
 * @param left - The left operand value
 * @param right - The right operand value (if evaluated)
 * @param result - The final result value
 * @param rightEvaluated - Whether the right operand was evaluated
 * @returns Step entry object for a short-circuiting operator
 */
function createShortCircuitingOperator(
  {
    operator = '',
    left,
    right,
    result,
    rightEvaluated,
  }: ShortCircuitingOperatorParameters = {} as ShortCircuitingOperatorParameters,
  {
    data,
  }: {
    readonly data: DataMode;
  } = {} as { readonly data: DataMode },
): ShortCircuitingOperatorEntry {
  return {
    category: 'operator',
    kind: 'short-circuiting',
    operator,
    left: representValue(left, data),
    result: representValue(result, data),
    rightEvaluated,
    ...(rightEvaluated && { right: representValue(right, data) }),
  };
}

export default createShortCircuitingOperator;
