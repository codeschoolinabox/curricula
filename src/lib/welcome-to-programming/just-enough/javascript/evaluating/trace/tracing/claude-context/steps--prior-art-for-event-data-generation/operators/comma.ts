import type { DataMode, CommaOperatorEntry } from '../types.js';
import representValue from '../utils/represent-value.js';

function createCommaOperationEntry(
  {
    operands = [],
  }: {
    readonly operands?: readonly unknown[];
  } = {},
  {
    data,
  }: {
    readonly data: DataMode;
  } = {} as { readonly data: DataMode },
): CommaOperatorEntry {
  return {
    category: 'operator',
    kind: 'comma',
    operator: ',',
    ...(data !== false && {
      operands: operands.map((op) => representValue(op, data)),
      result: representValue(operands.at(-1), data),
    }),
  };
}

export default createCommaOperationEntry;
