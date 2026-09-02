/**
 * @file The enrichment step (DOCS.md § Execution phases, phase 5's
 * enriching half; HR-12): one run's wire records, thread-authored io
 * failures, and pending interactions become the delivered events — the
 * enumerable attribution resolved against the facts' entwined record, the
 * graph views installed as NON-ENUMERABLE accessors so
 * `JSON.stringify(event)` stays clean while `event.node` answers the real
 * `EntwinedNode`. Worker order is authoritative: enrichment adds fields,
 * never sequence, and never renumbers a step.
 *
 * The join, in two stated operations, never folded together: an attributed
 * item's offset pair joins EXACTLY via `nodeAtSpan` (deepest exact span,
 * `null` means no exact match — its own contract); a non-exact span falls
 * back to the deepest ENCLOSING node — a single `byOffset` read at the
 * span's start — and an out-of-range start falls to the Program root (the
 * reference's universal fallback: the wire narrowing checks finiteness,
 * not range, and the delivered contract keeps `loc` and `nodePath` null
 * TOGETHER or present together). `nodeAtLoc` serves the settlement side's
 * line/column spans — a trip's loop span, the residual halt position,
 * already in the original text's space (the worker-side correction, human
 * ruling 2026-09-01) — converting through a lineStarts table built once
 * per run from the facts' source (UTF-16 code units, acorn's own offset
 * space), then joining the same way; a line outside the source answers
 * `null`.
 *
 * The four views: `node` answers the live `EntwinedNode` at the resolved
 * path; `callee` answers the resolved call's callee node (`calleePath`
 * rides enumerable beside it, exactly on the call-backed arms — an error
 * moment has no call and no callee members); `prev`/`next` answer the
 * neighbouring DELIVERED events through the run's timeline. The timeline
 * pointer is the NAMED no-mutable-closures exception (HR-12's mechanism
 * bullet), scoped: accessors are installed inside `onMessage` before
 * return, and no delivered event is ever written after yield — the
 * timeline grows, the events do not change. Each delivered event is
 * frozen where authored; its interior arrived frozen from each item's own
 * author, and the views stay invisible to any enumerable-walking deep
 * freeze downstream.
 *
 * Across a re-embodiment the views answer from a stale graph — the
 * enumerable `nodePath` is the durable attribution (README § The events).
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import nodeAtSpan from '../../embody/node-at-span.js';
import type { Entwined, EntwinedNode, NodePath } from '../../embody/types.js';

import type {
	InterceptEnrichable,
	InterceptEnrichment,
	InterceptEvent,
	InterceptLoc,
} from './types.js';

/**
 * Build one run's enrichment surface.
 *
 * @param facts - The two fact members enrichment resolves through: the
 *   learner's own text (the facts' `source.value`, the coordinate space
 *   every stamped offset and span lives in) and the entwined record the
 *   run was driven with.
 * @returns The per-run surface: `enrich` for the arriving items,
 *   `nodeAtLoc` for the settlement side's line/column spans.
 */
export default function enrichEvent(facts: {
	readonly source: string;
	readonly entwined: Entwined;
}): InterceptEnrichment {
	const { source, entwined } = facts;
	const lineStarts = buildLineStarts(source);
	// The run's delivered timeline — the NAMED no-mutable-closures
	// exception (HR-12's mechanism bullet), scoped: grown only by enrich,
	// inside onMessage, before return; read only through the views.
	const timeline: InterceptEvent[] = [];

	return freezeInPlace({
		enrich(item: InterceptEnrichable): InterceptEvent {
			const attribution = resolveAttribution(entwined, item);
			const event = buildDeliveredEvent(item, attribution, {
				entwined,
				timeline,
				index: timeline.length,
			});
			// eslint-disable-next-line functional/immutable-data -- the timeline grows per delivery: the ruled exception's one write site
			timeline.push(event);
			return event;
		},
		nodeAtLoc(loc: InterceptLoc): EntwinedNode | null {
			const start = offsetOf(lineStarts, loc.start);
			const end = offsetOf(lineStarts, loc.end);
			if (start === null || end === null) {
				return null;
			}
			return (
				nodeAtSpan(entwined, start, end) ?? entwined.byOffset[start] ?? null
			);
		},
	});
}

type Attribution = {
	readonly nodePath: NodePath | null;
	readonly calleePath: NodePath | null;
};

type ViewContext = {
	readonly entwined: Entwined;
	readonly timeline: readonly InterceptEvent[];
	readonly index: number;
};

/**
 * The join: exact first (`nodeAtSpan`'s own contract — null means no
 * exact match), then the deepest ENCLOSING node — a single `byOffset`
 * read at the span's start, a SEPARATE operation by ruling — then the
 * Program root for an out-of-range start (the reference's universal
 * fallback), so an attributed item always resolves and the delivered
 * both-or-neither invariant holds. `calleePath` derives exactly when the
 * resolved node is a call: the entwined graph keys the callee at the
 * call's own path plus `.callee`.
 */
function resolveAttribution(
	entwined: Entwined,
	item: InterceptEnrichable,
): Attribution {
	if (item.start === null || item.end === null) {
		return { nodePath: null, calleePath: null };
	}
	const resolved =
		nodeAtSpan(entwined, item.start, item.end) ??
		entwined.byOffset[item.start] ??
		entwined.root;
	const calleeKey = `${resolved.path}.callee`;
	const calleePath =
		resolved.node.type === 'CallExpression' &&
		Object.hasOwn(entwined.byPath, calleeKey)
			? calleeKey
			: null;
	return { nodePath: resolved.path, calleePath };
}

/**
 * One delivered event: the item's enumerable data plus the resolved
 * attribution, the views installed, frozen where authored. The error arm
 * carries no callee members — an error moment has no call — and keeps a
 * thread-authored io item's `source` through the spread.
 */
function buildDeliveredEvent(
	item: InterceptEnrichable,
	attribution: Attribution,
	context: ViewContext,
): InterceptEvent {
	const base =
		item.event === 'error'
			? { ...item, nodePath: attribution.nodePath }
			: {
					...item,
					nodePath: attribution.nodePath,
					calleePath: attribution.calleePath,
				};
	installGraphViews(base, item.event !== 'error', attribution, context);
	// WHY freeze here, not at the engine: freeze-where-authored is the
	// region's constraint, and the engine's own freeze-at-yield
	// (lib/engine/evaluate.ts — one shallow Object.freeze on the returned
	// item) then finds it already frozen. The interior arrived frozen from
	// each item's author, so this one shallow freeze completes the depth —
	// a value-walking deep freeze would only re-walk already-frozen
	// interiors for no behavioral gain (ar-4 2026-09-01).
	Object.freeze(base);
	// WHY the cast: the views are accessor properties invisible to the
	// object literal's structural type; the per-arm literals above carry
	// the enumerable halves exactly, and the suite pins the runtime shape.
	return base as InterceptEvent;
}

/**
 * The four NON-ENUMERABLE views (HR-12): resolved lazily at each get, so
 * `node` answers the LIVE entwined node and `next` starts answering when
 * the following delivery arrives — reads of the mutable timeline, never
 * writes. Installed before the event leaves `onMessage`; non-configurable
 * so the engine's freeze finds nothing left to change.
 */
function installGraphViews(
	base: object,
	hasCallee: boolean,
	attribution: Attribution,
	context: ViewContext,
): void {
	const { entwined, timeline, index } = context;
	const views: PropertyDescriptorMap = {
		node: viewOf(() => resolveByPath(entwined, attribution.nodePath)),
		prev: viewOf(() => timeline[index - 1] ?? null),
		next: viewOf(() => timeline[index + 1] ?? null),
		...(hasCallee
			? {
					callee: viewOf(() => resolveByPath(entwined, attribution.calleePath)),
				}
			: {}),
	};
	// eslint-disable-next-line functional/immutable-data -- installing the views on the fresh event before it leaves onMessage: the ruled mechanism's one install site (HR-12)
	Object.defineProperties(base, views);
}

/** One view descriptor: get-only, non-enumerable, non-configurable. */
function viewOf(get: () => unknown): PropertyDescriptor {
	return { get, enumerable: false, configurable: false };
}

function resolveByPath(
	entwined: Entwined,
	path: NodePath | null,
): EntwinedNode | null {
	if (path === null) {
		return null;
	}
	return entwined.byPath[path] ?? null;
}

/**
 * Where each 1-based line begins, in UTF-16 code units — built once per
 * run; the conversion's whole table. A one-line source is `[0]`; the
 * trailing newline's phantom line start is harmless (no node lives
 * there, and an out-of-range column resolves through the join's own
 * boundaries).
 */
function buildLineStarts(source: string): readonly number[] {
	// WHY split, not code-point iteration: segment lengths are UTF-16 code
	// units — the offset space — where a spread or for-of would count code
	// points and drift past every surrogate pair.
	const segments = source.split('\n').slice(0, -1);
	const lineStarts = [0];
	for (const segment of segments) {
		// eslint-disable-next-line functional/immutable-data -- building the per-run table once, before anyone holds it
		lineStarts.push((lineStarts.at(-1) ?? 0) + segment.length + 1);
	}
	return lineStarts;
}

/** A 1-based line / 0-based column position → its UTF-16 offset, or null
 * for a line the source does not have. */
function offsetOf(
	lineStarts: readonly number[],
	position: { readonly line: number; readonly column: number },
): number | null {
	// WHY the explicit type: noUncheckedIndexedAccess is off, so an
	// out-of-range read TYPES as number while being undefined at runtime
	// (node-at-span's own honest-annotation pattern).
	const lineStart: number | undefined = lineStarts[position.line - 1];
	return lineStart === undefined ? null : lineStart + position.column;
}
