/**
 * @file Types for intercept's AST-entwining layer.
 *
 * Mirrors trace's `ASTNode` shape so trace's eventual `link()` rebuild
 * can copy this directory as a starting point. Until then, intercept is
 * the only consumer.
 *
 * Two-tier lookup provenance:
 * - 'exact'              — a node's `.loc.start` matched the runtime (line, column)
 * - 'enclosing-fallback' — no exact match; deepest containing node was used
 */

import type {
	InterceptEvent,
} from '../../shared/types.js';

// ─── Source location (mirrors acorn / trace) ─────────────────

/** 1-based line, 0-based column — matches acorn's `locations: true` output. */
type SourcePosition = {
	readonly line: number;
	readonly column: number;
};

type SourceLocation = {
	readonly start: SourcePosition;
	readonly end: SourcePosition;
};

// ─── nodePath provenance ─────────────────────────────────────

/**
 * How a `LinkedInterceptEvent.nodePath` was determined.
 *
 * - `'instrumented'`        — the happy path. Every CallExpression in the
 *                            user's program is wrapped at AST-walk time with
 *                            `__c('nodePath', () => <call>)`, which pushes
 *                            the call's nodePath onto a worker-side slot
 *                            (`__currentPath`) before the call fires and
 *                            restores it after. Trap functions read
 *                            `__currentPath` directly — no `Error.stack`
 *                            parsing, no fuzzy lookup, exact attribution
 *                            for direct calls, aliased calls, computed
 *                            access, and conditional dispatch alike.
 * - `'enclosing-fallback'` — residual: a runtime error fired OUTSIDE any
 *                            CallExpression (e.g. bare `null.foo;`). Line
 *                            extracted from `Error.stack`, mapped to the
 *                            deepest containing AST node. Rare in practice.
 *                            `nodePathFallbackFrom` carries the original
 *                            location so the heuristic is auditable.
 * - `'no-ast'`             — no AST was built for this run (validation
 *                            failed before parsing produced a usable tree).
 *                            `nodePath` and `node` are both `null`. Applies
 *                            to the lone `ErrorEvent` from `phase: 'creation'`.
 */
type NodePathSource = 'instrumented' | 'enclosing-fallback' | 'no-ast';

// ─── ASTNode ─────────────────────────────────────────────────

/**
 * An ESTree-style AST node enriched with intercept-tracing metadata.
 *
 * @remarks Built once per intercept run from the validated `Program`,
 * then frozen and exposed on `InterceptResult.ast`. Every linked event's
 * `.node` is a direct reference into this structure.
 *
 * **Circular reference**: `parent` forms a cycle. `events` may contain
 * objects whose `.node` points back here. `JSON.stringify` will throw
 * unless a replacer is used. `deepFreezeInPlace` (used to freeze the
 * result) handles cycles via a visited-set; see [utils/deep-freeze-in-place.ts].
 *
 * Navigation:
 * - `node.syntaxId` — nodePath string (e.g. `'$.body.0.expression'`)
 * - `node.parent`   — parent `ASTNode`, or `null` at the Program root
 * - `node.loc`      — source location (acorn-derived)
 * - `node.source`   — source text spanning this node
 * - `node.events`   — events fired on this node, in execution order.
 *                     Each entry carries `.step` (1-indexed position in
 *                     the global event stream), so consumers can read
 *                     `node.events[i].step` to know exactly when in the
 *                     run that fire happened — without scanning
 *                     `result.events`. Entries appear in ascending
 *                     `.step` order (worker emits sequentially; the
 *                     main loop pushes in receive order).
 *
 * Standard ESTree children (`.body`, `.expression`, `.arguments`, etc.)
 * are present as `ASTNode` references via the open record extension.
 * Discriminate on `node.type` before accessing children.
 */
type ASTNode = {
	readonly syntaxId: string;
	readonly parent: ASTNode | null;
	readonly type: string;
	readonly loc: SourceLocation;
	readonly source: string;
	readonly events: readonly LinkedInterceptEvent[];
} & { readonly [key: string]: unknown };

// ─── LinkedInterceptEvent ────────────────────────────────────

/**
 * Intercept event enriched with AST navigation.
 *
 * @remarks `& InterceptEvent` distributes over the discriminated union, so
 * `LinkedConsoleEvent`, `LinkedPromptEvent`, etc. each gain the same set
 * of navigation fields without losing their discriminants.
 *
 * Every linked event carries:
 * - `nodePath` — the AST nodePath string (`'$.body.0.expression'`) of the
 *   firing CallExpression
 * - `nodePathSource` — provenance: `'instrumented'` (happy path),
 *   `'enclosing-fallback'` (residual error path), or `'no-ast'`
 * - `node` — direct reference into `result.ast`
 * - `loc` — same `SourceLocation` reference as `event.node.loc`. Single
 *   source of truth: the AST. Consumers read `event.loc.start.line` /
 *   `event.loc.start.column` for integer positions, OR navigate via
 *   `event.nodePath` / `event.node` for tree access.
 *
 * Nullability invariants:
 * - `nodePath`, `node`, and `loc` are all `null` together, only when
 *   `nodePathSource === 'no-ast'` — i.e. validation failed before parsing
 *   produced a usable tree, so the lone `ErrorEvent` from `phase: 'creation'`
 *   has nothing to link to.
 * - For all worker-emitted events (validation succeeded), all three are
 *   non-null. `nodePathSource` documents the resolution path:
 *   `'instrumented'` for trap fires inside an `__$ic` wrap (≈100% of events),
 *   `'enclosing-fallback'` for residual runtime errors fired outside any
 *   wrapped call.
 *
 * Timeline access via `step`: every event carries `step: number` (1-indexed,
 * contiguous, inherited from `InterceptEvent`). After link, `node.events`
 * accumulates back-refs in step order, so `node.events[i].step` reveals
 * exactly when in the global stream that fire occurred — consumers can
 * reconstruct the timeline without scanning `result.events`.
 */
type LinkedInterceptEvent = InterceptEvent & {
	readonly nodePath: string | null;
	readonly nodePathSource: NodePathSource;
	/** Present only when `nodePathSource === 'enclosing-fallback'` —
	 *  the original `(line, column)` from `Error.stack` that the
	 *  residual error path used to find the deepest enclosing node. */
	readonly nodePathFallbackFrom?: SourcePosition;
	readonly node: ASTNode | null;
	readonly loc: SourceLocation | null;
};

// ─── LocationIndex ───────────────────────────────────────────

/**
 * Built once per run from the validated `Program`. Carries everything
 * the lookup function needs: `astByPath` for nodePath → node resolution,
 * `exactStarts` for the fast-path exact-match check, and `containmentRoots`
 * for the enclosing-fallback walk.
 *
 * Opaque to consumers — only `build-location-index` and `lookup-node-path`
 * reach inside.
 */
type LocationIndex = {
	/** `nodePath` → `ASTNode`. Used by `link()` to attach `.node` refs and
	 *  by callers needing direct node retrieval. */
	readonly astByPath: ReadonlyMap<string, ASTNode>;
	/** `"line:column"` (1-based line, 0-based column) → `nodePath` of the
	 *  deepest node whose `.loc.start` is at exactly that position. Used
	 *  for the fast-path exact lookup. */
	readonly exactStarts: ReadonlyMap<string, string>;
	/** Program root, kept for the containment walk used by enclosing-fallback. */
	readonly root: ASTNode;
};

export type {
	SourcePosition,
	SourceLocation,
	NodePathSource,
	ASTNode,
	LinkedInterceptEvent,
	LocationIndex,
};
