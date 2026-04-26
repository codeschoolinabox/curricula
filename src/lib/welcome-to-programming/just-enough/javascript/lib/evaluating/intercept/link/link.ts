/**
 * @file Post-completion linking step for intercept's AST entwining.
 *
 * Mirrors trace's `link()` design (currently a stub at trace's
 * `semantics/tracing/link.ts`). When trace's real link is built, this
 * file is the starting point.
 *
 * Contract:
 * - Input events ALREADY carry `nodePath`, `nodePathSource`, and
 *   (when `'enclosing-fallback'`) `nodePathFallbackFrom`. That
 *   enrichment happens in intercept.ts's main loop, per event,
 *   before each `yield` — so streaming consumers see provenance
 *   in real time. Events also carry `step` (1-indexed sequence
 *   number) stamped at emission time by the worker (or main thread
 *   for engine-level errors).
 * - This step adds the `.node: ASTNode` reference (resolved via
 *   `astByPath.get(nodePath)`) and pushes the linked event into
 *   `node.events[]` (the AST → events back-reference).
 * - `node.events` accumulates in input order, which is `step` order
 *   (events arrive at the main loop sequentially and are pushed in
 *   receive order). `node.events[i].step` reveals timeline position.
 * - Both mutations are IN-PLACE, preserving event identity. This is
 *   load-bearing for intercept's replay invariant: a second
 *   `for await` over a settled handle must yield the SAME event
 *   references as the live iteration.
 * - Events with `nodePath: null` (i.e. validation failed and no AST
 *   was built — `nodePathSource: 'no-ast'`) get `node: null`, no
 *   back-ref pushed.
 *
 * Freezing happens AFTER link, in the caller (intercept.ts's
 * `getResult`). `deepFreezeInPlace` handles the resulting cycles.
 */

import type {
	ASTNode,
	LinkedInterceptEvent,
} from './types.js';

/**
 * Mutable view of LinkedInterceptEvent for in-place enrichment.
 * Matches the contract in the file header.
 */
type EnrichedEvent = Omit<LinkedInterceptEvent, 'node'> & {
	node?: ASTNode | null;
};

function link(
	events: readonly EnrichedEvent[],
	astByPath: ReadonlyMap<string, ASTNode>,
): readonly LinkedInterceptEvent[] {
	for (const event of events) {
		if (event.nodePath === null) {
			// 'no-ast' provenance: validation failed, no AST exists.
			// Surface node as null so consumers can discriminate.
			(event as { node: ASTNode | null }).node = null;
			continue;
		}

		const node = astByPath.get(event.nodePath);
		if (node === undefined) {
			// Defensive: shouldn't happen if enrichment used this same
			// astByPath. If it does, surface as null rather than throwing,
			// so the rest of the result is still usable. Sandbox/tests
			// will catch it via the explicit null.
			(event as { node: ASTNode | null }).node = null;
			continue;
		}

		(event as { node: ASTNode }).node = node;
		// Back-ref. `events` array on ASTNode starts mutable (built that
		// way in build-location-index); the consumer-facing readonly
		// declaration is enforced post-freeze by deepFreezeInPlace.
		(node.events as LinkedInterceptEvent[]).push(event as LinkedInterceptEvent);
	}

	return events as readonly LinkedInterceptEvent[];
}

export type { EnrichedEvent };
export default link;
