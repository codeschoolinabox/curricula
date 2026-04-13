/**
 * @file Minimal placeholder implementation of `link()`.
 *
 * The real `link()` function will take scalar `TraceEvent`s yielded by the
 * generator and attach a direct `.node: ASTNode` reference to each one,
 * producing `LinkedTraceEvent`s for `TraceResult.events`. That requires a
 * real ast record built during `instrument()` (a flat `Record<nodePath,
 * ASTNode>` keyed by every emitted event's `.nodePath`), which is deferred
 * to Capstone (F1/F7 work).
 *
 * For the alignment sprint, this stub attaches an empty `ASTNode` sentinel
 * to each event so callers can type-check against `TraceResult.events:
 * readonly LinkedTraceEvent[]` without lying at every return site. The
 * sentinel is not frozen and not shared across calls — it's a migration
 * placeholder, not a real node.
 *
 * TODO(Capstone): replace with real link() that:
 *   1. Takes the `ast` record from `instrument()`
 *   2. Looks up `ast[event.nodePath]` for each event
 *   3. Assigns `.node` with a real ASTNode reference
 *   4. Populates `ASTNode.events[]` back-refs (circular, handled by freezeInPlace)
 */

import type { TraceEvent, LinkedTraceEvent, ASTNode } from './types.js';

/**
 * Stub `link()` — attaches an empty ASTNode sentinel to each TraceEvent.
 *
 * WHY type assertion: the sentinel `{}` has none of the ASTNode required
 * fields. The real ast record doesn't exist yet (Capstone work), so we lie
 * to the type system in ONE place instead of at every call site.
 */
function link(events: readonly TraceEvent[]): readonly LinkedTraceEvent[] {
	const stubNode = {} as ASTNode;
	return events.map(function toLinked(event): LinkedTraceEvent {
		return { ...event, node: stubNode } as LinkedTraceEvent;
	});
}

export default link;
