import type { DataMode, PureOperatorEntry } from '../types.js';
import representCoercion from '../utils/represent-coercion.js';
import representValue from '../utils/represent-value.js';

/**
 * Factory for pure operator step entries
 * Pure operators produce values without side effects (e.g., +, -, *, ==, <, typeof, in, instanceof, void)
 *
 * @param params - Object containing operator, result, and operands
 * @param meta - Object containing configuration (data mode)
 * @returns Step entry object for a pure operator
 */
function createPureOperationEntry(
  {
    operator = '',
    result,
    operands = [],
  }: {
    readonly operator?: string;
    readonly result: unknown;
    readonly operands?: readonly unknown[];
  } = {} as {
    readonly operator?: string;
    readonly result: unknown;
    readonly operands?: readonly unknown[];
  },
  {
    data,
    coercion,
  }: {
    readonly data: DataMode;
    readonly coercion: boolean;
  } = {} as {
    readonly data: DataMode;
    readonly coercion: boolean;
  },
): PureOperatorEntry {
  return {
    category: 'operator',
    kind: 'pure',
    operator,
    ...(data !== false && {
      operands: operands.map((op) => representValue(op, data)),
      result: representValue(result, data),
      ...(coercion && { coercion: representCoercion(operator, operands, data) }),
    }),
  };
}

export default createPureOperationEntry;
