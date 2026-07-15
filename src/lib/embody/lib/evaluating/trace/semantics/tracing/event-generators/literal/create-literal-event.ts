import type { BaseEvent, LiteralEvent, LiteralKind } from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a LiteralEvent. The literal's value rides the
 * paired ResolveEvent (kind: 'literal'), not this event. The dispatcher stamps
 * the base fields.
 *
 * @param params - the literal kind
 * @returns Domain fields for a LiteralEvent
 * @throws {Error} If kind is missing or invalid
 */
export default function createLiteralEvent(
	{ kind }: { readonly kind: LiteralKind } = {} as {
		readonly kind: LiteralKind;
	},
): LiteralDomainFields {
	if (!kind || !VALID_KINDS.has(kind)) {
		throw new Error(
			`createLiteralEvent: kind must be one of ${Array.from(VALID_KINDS).join(', ')}`,
		);
	}

	return {
		category: 'literal',
		kind,
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

/** Domain fields (base stamped downstream) for LiteralEvent. */
type LiteralDomainFields = {
	readonly category: 'literal';
	readonly kind: LiteralKind;
};

type _AssertLiteral = Expect<
	Equal<LiteralDomainFields, DistributiveOmit<LiteralEvent, keyof BaseEvent>>
>;
