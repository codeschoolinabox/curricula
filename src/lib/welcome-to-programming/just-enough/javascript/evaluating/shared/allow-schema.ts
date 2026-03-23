/**
 * @file JSON Schema defining the AllowConfig structure.
 *
 * Used by expandShorthand to know which boolean values should expand
 * to full objects, and by fillDefaults to know which keys exist at
 * each level. This schema is the single source of truth for the
 * AllowConfig shape — the TypeScript type mirrors it.
 *
 * Schema conventions:
 * - Every leaf property has `type: 'boolean'`
 * - Every branch property has `type: 'object'` with boolean sub-properties
 * - Top-level properties that accept boolean shorthand have all-boolean
 *   children (detected by expandShorthand's `shouldExpand` heuristic)
 * - No defaults are set in the schema — fillDefaults uses a mode-dependent
 *   default (`false` for allow, `true` for block)
 */

import type { JSONSchema } from './types.js';

const stringMethodsSchema: JSONSchema = {
	type: 'object',
	properties: {
		toLowerCase: { type: 'boolean' },
		toUpperCase: { type: 'boolean' },
		includes: { type: 'boolean' },
		replaceAll: { type: 'boolean' },
		trim: { type: 'boolean' },
		indexOf: { type: 'boolean' },
		slice: { type: 'boolean' },
	},
	additionalProperties: false,
};

const allowSchema: JSONSchema = {
	type: 'object',
	properties: {
		variables: {
			type: 'object',
			properties: {
				let: { type: 'boolean' },
				const: { type: 'boolean' },
			},
			additionalProperties: false,
		},
		console: {
			type: 'object',
			properties: {
				log: { type: 'boolean' },
				assert: { type: 'boolean' },
			},
			additionalProperties: false,
		},
		interactions: {
			type: 'object',
			properties: {
				alert: { type: 'boolean' },
				confirm: { type: 'boolean' },
				prompt: { type: 'boolean' },
			},
			additionalProperties: false,
		},
		conditionals: { type: 'boolean' },
		loops: {
			type: 'object',
			properties: {
				while: { type: 'boolean' },
				forOf: { type: 'boolean' },
			},
			additionalProperties: false,
		},
		jumps: {
			type: 'object',
			properties: {
				break: { type: 'boolean' },
				continue: { type: 'boolean' },
			},
			additionalProperties: false,
		},
		operators: {
			type: 'object',
			properties: {
				typeof: { type: 'boolean' },
				not: { type: 'boolean' },
				negation: { type: 'boolean' },
				and: { type: 'boolean' },
				or: { type: 'boolean' },
				equality: { type: 'boolean' },
				comparison: { type: 'boolean' },
				plus: { type: 'boolean' },
				arithmetic: { type: 'boolean' },
				ternary: { type: 'boolean' },
			},
			additionalProperties: false,
		},
		strings: {
			type: 'object',
			properties: {
				indexAccess: { type: 'boolean' },
				length: { type: 'boolean' },
				methods: stringMethodsSchema,
			},
			additionalProperties: false,
		},
		templates: { type: 'boolean' },
		coercion: {
			type: 'object',
			properties: {
				number: { type: 'boolean' },
				string: { type: 'boolean' },
				boolean: { type: 'boolean' },
				numberIsNaN: { type: 'boolean' },
			},
			additionalProperties: false,
		},
	},
	additionalProperties: false,
};

export default allowSchema;
