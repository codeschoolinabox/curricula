import type {
	BaseEvent,
	ConditionalEvent,
	LoopEvent,
	ValueRepresentation,
	LoopKind,
} from '../../types.js';
import type { DistributiveOmit, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a control-flow test event — the condition
 * evaluation of an if/ternary (ConditionalEvent) or a while/doWhile/for loop
 * (LoopEvent). Pure factory of its already-resolved kind: the advice decides
 * if-vs-ternary / which-loop and passes the domain kind; this splits on it into
 * the conditional or loop category. The dispatcher stamps the base fields.
 *
 * @param params - resolved kind, tested value, boolean result, optional coercion, scope ref
 * @returns Domain fields for a ConditionalEvent(test) or LoopEvent(test)
 */
export default function createTestEvent(
	{
		kind,
		value,
		result,
		coercion,
		scopeCreationStep,
	}: TestParams = {} as TestParams,
): TestDomainFields {
	const common = {
		event: 'test' as const,
		value,
		result,
		scopeCreationStep,
		...(coercion !== undefined && { coercion }),
	};

	if (isLoopKind(kind)) {
		return { category: 'loop', kind, ...common };
	}
	return { category: 'conditional', kind, ...common };
}

function isLoopKind(kind: ConditionalKind | LoopKind): kind is LoopKind {
	return kind !== 'if' && kind !== 'ternary';
}

type ConditionalKind = 'if' | 'ternary';

type TestParams = {
	readonly kind: ConditionalKind | LoopKind;
	readonly value: ValueRepresentation;
	readonly result: boolean;
	readonly coercion?: ValueRepresentation;
	readonly scopeCreationStep: number;
};

/**
 * The domain fields (base fields stamped downstream): the conditional-arm and
 * loop-arm of a test event — ConditionalEvent(test) / LoopEvent(test) minus
 * BaseEvent. Hand-written because a naive Omit over the intersection-of-unions
 * ConditionalEvent/LoopEvent collapses the discriminated variants to their
 * common keys.
 */
type TestDomainFields =
	| {
			readonly category: 'conditional';
			readonly kind: ConditionalKind;
			readonly event: 'test';
			readonly value: ValueRepresentation;
			readonly result: boolean;
			readonly coercion?: ValueRepresentation;
			readonly scopeCreationStep: number;
	  }
	| {
			readonly category: 'loop';
			readonly kind: LoopKind;
			readonly event: 'test';
			readonly value: ValueRepresentation;
			readonly result: boolean;
			readonly coercion?: ValueRepresentation;
			readonly scopeCreationStep: number;
	  };

type _AssertTestShape = Expect<
	[TestDomainFields] extends [
		| DistributiveOmit<ConditionalEvent, keyof BaseEvent>
		| DistributiveOmit<LoopEvent, keyof BaseEvent>,
	]
		? true
		: false
>;
