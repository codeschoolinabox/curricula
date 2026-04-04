import deepClone from '../../../../../utils/deep-clone.js';
import type {
  DataMode,
  FullValueRepresentation,
  TypesValueRepresentation,
  ValuesValueRepresentation,
  ValueRepresentation,
} from '../types.js';

/**
 * Gets the prototype lookup chain for a value
 * For primitives: shows the theoretical chain used during property access
 * For objects/functions: shows the actual prototype chain
 */
function getPrototypeLookup(value: unknown): readonly string[] {
  if (value === null || value === undefined) return [];

  const valueType = typeof value;

  // Primitives show their lookup chain (what happens during property access)
  if (valueType === 'number') return ['Number', 'Object', 'null'];
  if (valueType === 'string') return ['String', 'Object', 'null'];
  if (valueType === 'boolean') return ['Boolean', 'Object', 'null'];
  if (valueType === 'bigint') return ['BigInt', 'Object', 'null'];
  if (valueType === 'symbol') return ['Symbol', 'Object', 'null'];

  // Objects/functions: walk actual prototype chain
  if (valueType === 'object' || valueType === 'function') {
    const lookup: readonly string[] = [];
    let proto = Object.getPrototypeOf(value);

    while (proto !== null) {
      const constructorName = (proto as { readonly constructor?: { readonly name?: string } })
        .constructor?.name;
      if (constructorName) {
        lookup.push(constructorName);
      }
      proto = Object.getPrototypeOf(proto);
    }

    if (lookup.length > 0) lookup.push('null');
    return lookup;
  }

  return [];
}

/**
 * Gets the constructor name if the value is an instance (instanceof returns true)
 * Returns null for primitives, null, undefined, and objects without constructors
 */
function getInstance(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const valueType = typeof value;
  // Primitives explicitly return null (not an instance of anything)
  if (valueType !== 'object' && valueType !== 'function') return null;

  // Return constructor name (most specific)
  const ctor = (value as { readonly constructor?: { readonly name?: string } }).constructor;
  return ctor ? (ctor.name ?? null) : null;
}

/**
 * Represents any JavaScript value with configurable detail levels:
 *
 * @param value - The JavaScript value to represent
 * @param mode - How to represent the value:
 *   - 'full': Complete representation { type, value, lookup, instance } with serialization
 *   - 'types': Type metadata only { type, lookup, instance } (no value field)
 *   - 'values': Serialized value wrapped { value: serializedValue }
 *   - 'raw': Deep cloned raw value (captures snapshot at logging time)
 *   - false: Returns undefined (no value representation)
 *
 * Modes explanation:
 * - full: Current behavior - best for debugging and education
 * - types: Type flow analysis without actual values
 * - values: Compact wrapped values with serialization
 * - raw: Direct value snapshot, prevents side-effect mutations
 * - false: Minimal entries (e.g., operator precedence tracking)
 *
 * @returns Value representation based on mode, or undefined if mode is false
 */
function representValue(value: unknown, mode: 'full'): FullValueRepresentation;
function representValue(value: unknown, mode: 'types'): TypesValueRepresentation;
function representValue(value: unknown, mode: 'values'): ValuesValueRepresentation;
function representValue(value: unknown, mode: 'raw'): unknown;
function representValue(value: unknown, mode: false): undefined;
function representValue(value: unknown, mode: DataMode): ValueRepresentation;
function representValue(value: unknown, mode: DataMode): ValueRepresentation {
  // Early return for false mode
  if (mode === false) {
    return;
  }

  const type = typeof value;
  const lookup = getPrototypeLookup(value);
  const instance = getInstance(value);

  // Handle 'types' mode - no value field
  if (mode === 'types') {
    return { type, lookup, instance };
  }

  // Handle value serialization for full/values/raw modes
  let valueRepresentation;

  if (
    value === null ||
    value === undefined ||
    type === 'boolean' ||
    type === 'number' ||
    type === 'string' ||
    type === 'bigint'
  ) {
    valueRepresentation = value;
  } else if (type === 'symbol') {
    // Symbols can't be serialized directly, use string representation
    // Note: This loses uniqueness - two different Symbol('x') will look the same
    valueRepresentation = (value as symbol).toString();
  } else if (type === 'function') {
    // First line only to keep output manageable
    const function_ = value as Function;
    const firstLine = function_.toString().split('\n')[0];
    valueRepresentation = {
      name: function_.name || 'anonymous',
      length: function_.length,
      preview: firstLine,
    };
  } else {
    // Objects - use deepClone for serialization
    valueRepresentation = deepClone(value);
  }

  // Return based on mode
  if (mode === 'full') {
    return { type, value: valueRepresentation, lookup, instance };
  }

  if (mode === 'values') {
    // Wrapped serialized value
    return { value: valueRepresentation };
  }

  if (mode === 'raw') {
    // Deep clone to capture snapshot, preventing mutations
    return deepClone(value);
  }

  throw new Error(`Invalid representValue mode: ${mode}`);
}

export default representValue;
