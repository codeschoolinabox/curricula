import type {
	LiteralEvent,
	LiteralKind,
	ValueRepresentation,
} from '../../types.js';

/**
 * Creates a LiteralEvent for when a value is created from a literal expression.
 *
 * @param params - The literal kind and its value representation
 * @returns The domain-specific fields for a LiteralEvent (without BaseEvent metadata)
 * @throws {Error} If kind or value is missing
 */
export default function createLiteralEvent(
	{
		kind,
		value,
	}: {
		readonly kind: LiteralKind;
		readonly value: ValueRepresentation;
	} = {} as { readonly kind: LiteralKind; readonly value: ValueRepresentation },
): Omit<LiteralEvent, 'step' | 'semantics' | 'loc' | 'node' | 'source'> {
	if (!kind || !VALID_KINDS.has(kind)) {
		throw new Error(
			`createLiteralEvent: kind must be one of ${Array.from(VALID_KINDS).join(', ')}`,
		);
	}
	if (value === undefined || value === null) {
		throw new Error('createLiteralEvent: value is required');
	}

	return {
		category: 'literal',
		kind,
		value,
	};
}

const VALID_KINDS = new Set<LiteralKind>([
	'string',
	'boolean',
	'number',
	'undefined',
	'null',
	'regex',
]);
