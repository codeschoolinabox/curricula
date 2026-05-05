/**
 * @file Types for the configuring module.
 *
 * Defines JSONSchema type for schema-driven validation and default-filling.
 */

/**
 * JSON Schema type for options validation.
 *
 * Subset of JSON Schema draft-07 covering features we use:
 * - type, enum, default for field definitions
 * - properties, required, additionalProperties for objects
 * - items for arrays
 * - minimum, maximum for numbers
 * - oneOf for union types (e.g., null | array)
 * - minItems, maxItems for array length constraints
 */
type JSONSchema = {
  readonly $schema?: string;
  readonly type?: string | readonly string[];
  readonly properties?: Readonly<Record<string, JSONSchema>>;
  readonly items?: JSONSchema;
  readonly additionalProperties?: boolean | JSONSchema;
  readonly required?: readonly string[];
  readonly enum?: readonly unknown[];
  readonly default?: unknown;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly oneOf?: readonly JSONSchema[];
  readonly description?: string;
};

export type { JSONSchema };
