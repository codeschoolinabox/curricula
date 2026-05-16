/**
 * @file Types for the prepare module.
 *
 * Contains:
 * - `PreparedTraceInput` — shape returned by `prepareForTrace` (validated
 *   code + resolved options + passthrough meta fields)
 * - `JSONSchema` — subset of JSON Schema draft-2020-12 used by the prep
 *   pipeline (`expand-shorthand`, `fill-defaults`, `validate-config`,
 *   `prepare-config`)
 */

import type { SourceRange } from '../config.types.js';

/**
 * Output of `prepareForTrace` — everything the trace engine needs to begin
 * execution, with validation and defaults already applied.
 *
 * @remarks
 * - `code` is guaranteed to be a string (validated at the boundary)
 * - `options` is a fully-resolved config object matching `options.schema.json`
 *   after expand-shorthand → fill-defaults → validate. All ResolveKind gates,
 *   expression/statement/scope sub-gates, and the `dependent`/`provenance`
 *   flags are present and populated.
 * - `range`, `iterations`, `seconds` are passed through as-is (the user may
 *   omit them; downstream code handles undefined with its own defaults or
 *   treats absent as "no limit / no filter")
 */
type PreparedTraceInput = {
	readonly code: string;
	readonly options: Record<string, unknown>;
	readonly range?: SourceRange;
	readonly iterations?: number;
	readonly seconds?: number;
};

/**
 * JSON Schema type for options validation.
 *
 * Subset of JSON Schema draft-2020-12 covering the features JEJ uses:
 * - type, enum, default for field definitions
 * - properties, required, additionalProperties for objects
 * - items for arrays
 * - minimum, maximum for numbers
 * - oneOf for union types (e.g., null | array)
 * - minItems, maxItems for array length constraints
 */
type JSONSchema = {
	readonly $schema?: string;
	readonly $id?: string;
	readonly title?: string;
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

export type { PreparedTraceInput, JSONSchema };
