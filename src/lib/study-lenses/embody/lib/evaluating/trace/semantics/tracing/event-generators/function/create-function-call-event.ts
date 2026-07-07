import type {
	BaseEvent,
	FunctionCallEvent,
	ValueRepresentation,
} from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a FunctionCallEvent (built-in function calls).
 * The dispatcher stamps the base fields.
 *
 * @param params - function name and arguments
 * @returns Domain fields for a FunctionCallEvent
 * @throws {Error} If name is missing or empty
 */
export default function createFunctionCallEvent(
	{
		name,
		args,
	}: {
		readonly name: string;
		readonly args: readonly ValueRepresentation[];
	} = {} as {
		readonly name: string;
		readonly args: readonly ValueRepresentation[];
	},
): FunctionCallDomainFields {
	if (!name) {
		throw new Error(
			'createFunctionCallEvent: name is required and must be non-empty',
		);
	}

	return {
		category: 'function',
		event: 'call',
		name,
		args,
	};
}

/** Domain fields (base stamped downstream) for FunctionCallEvent. */
type FunctionCallDomainFields = {
	readonly category: 'function';
	readonly event: 'call';
	readonly name: string;
	readonly args: readonly ValueRepresentation[];
};

type _AssertFunctionCall = Expect<
	Equal<
		FunctionCallDomainFields,
		DistributiveOmit<FunctionCallEvent, keyof BaseEvent>
	>
>;
