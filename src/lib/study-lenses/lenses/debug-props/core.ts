// cspell:ignore entwined failable

/**
 * @file The debug-props pure core: embodiment + resolved config → the props
 * summary (`./types.ts`). One entry per fact stage in stage order — ok
 * entries describe the value compactly (a count, or the snippet type),
 * failed entries carry the cause message in the machine's own words. One
 * entry per lifecycle phase in specification order — accessibility,
 * attached-lens names, and the barring cause's message when barred. The
 * configuration record is echoed as frozen data.
 *
 * No React; embody as types only. Architecture: `./DOCS.md`.
 */

import cloneAndFreeze from '@utils/clone-and-freeze.js';
import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	Embodiment,
	FactStage,
	FactStageName,
	FailableStageName,
	LifecyclePhase,
	LifecyclePhaseName,
	LifecyclePhaseOrder,
	Scope,
} from '../../embody/types.js';
import type { LensConfig } from '../types.js';

import type {
	FactStageSummary,
	PropertiesSummary,
	StudyPhaseSummary,
} from './types.js';

/**
 * Derive the props summary this lens renders: what a lens receives, as
 * serializable counts, flags, names, and messages.
 *
 * @param embodiment - The frozen study object the lens was mounted with.
 * @param config - The resolved configuration record, echoed into the summary.
 * @returns The frozen props summary.
 */
export default function summarize(
	embodiment: Embodiment,
	config: LensConfig,
): PropertiesSummary {
	const { facts, study } = embodiment;

	// the Record is both the compile pin and the presentation order: a stage
	// added to `Facts` must error here, never silently vanish from the dump
	// (see DOCS.md § Structural constraints), and the literal's declaration
	// order — string keys enumerate in insertion order — is the dump's order
	const stageSummaries: Readonly<Record<FactStageName, FactStageSummary>> = {
		source: {
			stage: 'source',
			ok: true,
			description: countOf(facts.source.value.length, 'character'),
		},
		tokens: describeStage('tokens', facts.tokens, (value) =>
			countOf(value.tokens.length, 'token'),
		),
		ast: describeStage('ast', facts.ast, (program) =>
			countOf(countSyntaxNodes(program), 'node'),
		),
		entwined: describeStage('entwined', facts.entwined, (value) =>
			countOf(Object.keys(value.byPath).length, 'node'),
		),
		environment: describeStage('environment', facts.environment, (value) =>
			countOf(countScopes(value.root), 'scope'),
		),
		type: { stage: 'type', ok: true, description: facts.type.value },
	};

	return freezeInPlace({
		facts: Object.values(stageSummaries),
		study: LIFECYCLE_PHASE_ORDER.map((phase) =>
			summarizePhase(phase, study[phase]),
		),
		config: cloneAndFreeze(config),
	});
}

// presentation order, compile-pinned: the lifecycle order `satisfies` the
// contract tuple (the fact order lives on the stage Record's declaration)
const LIFECYCLE_PHASE_ORDER = [
	'source',
	'tokens',
	'ast',
	'environment',
	'evaluation',
] as const satisfies LifecyclePhaseOrder;

function describeStage<Value>(
	stage: FailableStageName,
	result: FactStage<Value>,
	describeValue: (value: Value) => string,
): FactStageSummary {
	return result.ok
		? { stage, ok: true, description: describeValue(result.value) }
		: { stage, ok: false, causeMessage: result.cause.message };
}

function summarizePhase(
	phase: LifecyclePhaseName,
	payload: LifecyclePhase,
): StudyPhaseSummary {
	const lenses = payload.lenses.map((lens) => lens.name);
	return payload.accessible
		? { phase, accessible: true, lenses }
		: { phase, accessible: false, lenses, causeMessage: payload.cause.message };
}

/**
 * Count the syntax tree's nodes under the same node-membership rule the
 * entwined path grammar addresses (see DOCS.md § Decisions): an object
 * carrying a string `type`, reached through a non-metadata property,
 * directly or as an array element. An independent route to the same set as
 * the entwined index — agreement is the sanity check.
 */
function countSyntaxNodes(node: object): number {
	return Object.entries(node)
		.filter(([key]) => !isMetadataKey(key))
		.flatMap(([, value]) => toChildCandidates(value))
		.filter((value): value is object => isNodeLike(value))
		.reduce((total, child) => total + countSyntaxNodes(child), 1);
}

function toChildCandidates(value: unknown): ReadonlyArray<unknown> {
	return isUnknownArray(value) ? value : [value];
}

function isUnknownArray(value: unknown): value is ReadonlyArray<unknown> {
	return Array.isArray(value);
}

function isNodeLike(value: unknown): value is object {
	return (
		typeof value === 'object' &&
		value !== null &&
		'type' in value &&
		typeof value.type === 'string'
	);
}

/** The keys present on every acorn node that are never children. */
function isMetadataKey(key: string): boolean {
	return key === 'type' || key === 'start' || key === 'end' || key === 'loc';
}

// the environment's byPath keys scopes by introducing node, and global and
// module scopes share the Program node — counting the graph from its root is
// the honest count (see DOCS.md § Decisions)
function countScopes(scope: Scope): number {
	return scope.childScopes.reduce(
		(total, child) => total + countScopes(child),
		1,
	);
}

function countOf(count: number, noun: string): string {
	return count === 1 ? `1 ${noun}` : `${count} ${noun}s`;
}
