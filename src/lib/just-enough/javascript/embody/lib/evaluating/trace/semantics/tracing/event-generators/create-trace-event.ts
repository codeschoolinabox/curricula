import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import generators from './generators.js';

import type { SourceLocation, TraceEvent } from '../types.js';

type SourceMetadata = {
	readonly semantics: 'statement' | 'expression';
	readonly loc: SourceLocation;
	readonly node: string;
	readonly source: string;
};

/**
 * Resolves a dot-separated path to a leaf function in the generators namespace.
 * Returns undefined if the path doesn't resolve to a function.
 */
function resolveGenerator(
	path: string,
): ((...args: readonly unknown[]) => unknown) | undefined {
	const segments = path.split('.');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- walking a dynamic namespace
	let current: any = generators;

	for (const segment of segments) {
		if (current === undefined || current === null) return undefined;
		current = current[segment];
	}

	return typeof current === 'function' ? current : undefined;
}

/**
 * Creates a complete, frozen TraceEvent.
 *
 * This is the single entry point for creating trace events. It:
 * 1. Resolves the generator function from the config-mirroring namespace
 * 2. Calls the generator with the payload to get domain-specific fields
 * 3. Combines with source metadata (semantics, loc, node, source)
 * 4. Deep freezes and returns the complete event
 *
 * @param metadata - Source metadata from Aran's advice (semantics, loc, node, source)
 * @param generatorPath - Dot-separated path to the generator (e.g. 'operators.pure.arithmetic')
 * @param payload - Domain-specific data for the generator
 * @returns A complete, frozen TraceEvent
 * @throws {Error} If generatorPath doesn't resolve to a generator function
 */
function createTraceEvent(
	metadata: SourceMetadata,
	generatorPath: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload shape varies by generator
	payload: any,
): TraceEvent {
	const generator = resolveGenerator(generatorPath);
	if (!generator) {
		throw new Error(
			`createTraceEvent: no generator found at path '${generatorPath}'`,
		);
	}

	const domainFields = generator(payload) as Record<string, unknown>;
	const event = { ...metadata, ...domainFields };

	return deepFreezeInPlace(event) as TraceEvent;
}

export default createTraceEvent;
