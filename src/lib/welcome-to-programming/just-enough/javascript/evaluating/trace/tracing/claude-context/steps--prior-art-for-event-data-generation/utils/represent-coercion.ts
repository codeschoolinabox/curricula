import type { DataMode, ValueRepresentation } from '../types.js';

import representValue from './represent-value.js';

/**
 * Analyzes operator and operands to determine type coercion
 * Returns array parallel to operands with ALL values after coercion applied
 *
 * @param operator - The JavaScript operator being applied
 * @param operands - Array of operand values before coercion
 * @param mode - Value representation mode to pass through to representValue
 * @returns Array with all operands represented after coercion (same length as operands)
 */
export default function representCoercion(
  operator: string,
  operands: readonly unknown[],
  mode: DataMode,
): readonly ValueRepresentation[] {
  // Handle unary operators
  if (operands.length === 1) {
    if (operator === '!') {
      // NOT coerces operand to boolean
      const boolValue = Boolean(operands[0]);
      return [representValue(boolValue, mode)];
    }
    // Other unary operators - return operand as-is
    return [representValue(operands[0], mode)];
  }

  // For binary operators, determine coercion rules
  if (operands.length === 2) {
    const [left, right] = operands;
    const leftType = typeof left;
    const rightType = typeof right;

    // Numeric operators that coerce to numbers
    const numericOperators = ['+', '-', '*', '/', '%', '**', '|', '&', '^', '<<', '>>', '>>>'];

    // Comparison operators that may coerce
    const comparisonOperators = ['<', '>', '<=', '>='];

    // Equality operators with special coercion
    const abstractEqualityOperators = ['==', '!='];

    // Strict operators that never coerce
    const strictOperators = ['===', '!=='];

    // CLAUDE short-circuiting?  they implcilty coerce their values to boolean for their test, this.
    // or maybe we save these cases for later when we decide how to represent short-circuitings in step entry objects?

    if (strictOperators.includes(operator)) {
      // No coercion for strict equality - return both as-is
      return [representValue(left, mode), representValue(right, mode)];
    }

    // Addition has special rules (string concatenation vs numeric addition)
    if (operator === '+') {
      // If either operand is a string, both coerce to string
      if (leftType === 'string' || rightType === 'string') {
        return [representValue(String(left), mode), representValue(String(right), mode)];
      }
      // Otherwise, both coerce to number
      return [representValue(Number(left), mode), representValue(Number(right), mode)];
    }

    // Numeric operators coerce to numbers
    if (numericOperators.includes(operator) && operator !== '+') {
      return [representValue(Number(left), mode), representValue(Number(right), mode)];
    }

    // Comparison operators coerce based on operand types
    if (comparisonOperators.includes(operator)) {
      // If both are strings, compare as strings
      if (leftType === 'string' && rightType === 'string') {
        return [representValue(left, mode), representValue(right, mode)];
      }
      // Otherwise coerce to numbers
      return [representValue(Number(left), mode), representValue(Number(right), mode)];
    }

    // Abstract equality has complex rules
    if (abstractEqualityOperators.includes(operator)) {
      // null == undefined (no coercion, special case)
      if ((left === null && right === undefined) || (left === undefined && right === null)) {
        return [representValue(left, mode), representValue(right, mode)];
      }

      // Number vs String -> coerce string to number
      if (leftType === 'number' && rightType === 'string') {
        return [representValue(left, mode), representValue(Number(right), mode)];
      }
      if (leftType === 'string' && rightType === 'number') {
        return [representValue(Number(left), mode), representValue(right, mode)];
      }

      // Boolean vs anything -> coerce boolean to number
      if (leftType === 'boolean') {
        return [representValue(Number(left), mode), representValue(right, mode)];
      }
      if (rightType === 'boolean') {
        return [representValue(left, mode), representValue(Number(right), mode)];
      }

      // Object vs primitive -> coerce object to primitive (ToPrimitive)
      if (leftType === 'object' && left !== null && rightType !== 'object') {
        // This is a simplification - actual ToPrimitive is complex
        // Safe cast: we've verified left !== null and typeof left === 'object'
        const leftObject = left as { valueOf(): unknown; toString(): string };
        const primitive =
          leftObject.valueOf === Object.prototype.valueOf ? leftObject.toString() : leftObject.valueOf();
        return [representValue(primitive, mode), representValue(right, mode)];
      }
      if (rightType === 'object' && right !== null && leftType !== 'object') {
        // Safe cast: we've verified right !== null and typeof right === 'object'
        const rightObject = right as { valueOf(): unknown; toString(): string };
        const primitive =
          rightObject.valueOf === Object.prototype.valueOf ? rightObject.toString() : rightObject.valueOf();
        return [representValue(left, mode), representValue(primitive, mode)];
      }

      // Same type comparisons - no coercion
      return [representValue(left, mode), representValue(right, mode)];
    }

    // Logical operators are handled in operators/short-circuiting.ts
    // They perform implicit ToBoolean for testing but return original values
    // Return both as-is for now
    if (operator === '&&' || operator === '||' || operator === '??') {
      return [representValue(left, mode), representValue(right, mode)];
    }

    // in operator coerces left to string
    if (operator === 'in') {
      return [representValue(String(left), mode), representValue(right, mode)];
    }

    // Default: return both operands as-is
    return [representValue(left, mode), representValue(right, mode)];
  }

  // For ternary or other operators, return all operands as-is
  return operands.map((op) => representValue(op, mode));
}
