/**
 * @file Types for intercept's AST-entwining layer.
 *
 * Mirrors trace's `ASTNode` shape so trace's eventual `link()` rebuild
 * can copy this directory as a starting point. Until then, intercept is
 * the only consumer.
 *
 * Provenance values: every event records how its `nodePath` was determined
 * via `nodePathSource`. See `NodePathSource` below for the three values
 * (`'instrumented'`, `'enclosing-fallback'`, `'no-ast'`) and their semantics.
 */

import type { InterceptEvent } from '../../shared/types.js';

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
 * - `node.children` — flat array of every direct AST child, in source
 *                     order. Generic traversal primitive: a consumer can
 *                     walk the entire tree without knowing ESTree
 *                     property names per node type.
 *
 * Standard ESTree children (`.body`, `.expression`, `.arguments`,
 * `.callee`, etc.) are ALSO present as named `ASTNode` references via
 * the open record extension. The same `ASTNode` reference appears in
 * both `node.children` and the appropriate named slot — choose
 * whichever fits the consumer (named for typed access, `children` for
 * generic walks). Discriminate on `node.type` before accessing named
 * children.
 */
type ASTNode = {
	readonly syntaxId: string;
	readonly parent: ASTNode | null;
	readonly type: string;
	readonly loc: SourceLocation;
	readonly source: string;
	readonly events: readonly LinkedInterceptEvent[];
	readonly children: readonly ASTNode[];
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
 * contiguous, inherited from `InterceptEvent`). Events are entwined at
 * emission time by `enrichEvent` in [intercept.ts](../intercept.ts) — `.node`
 * and `node.events[]` back-refs are populated before each event is yielded,
 * so consumers iterating live see fully-linked events without waiting for
 * run completion. `node.events[i].step` reveals exactly when in the global
 * stream that fire occurred — consumers can reconstruct the timeline
 * without scanning `result.events`.
 */
type LinkedInterceptEvent = InterceptEvent & {
	readonly nodePath: string | null;
	readonly nodePathSource: NodePathSource;
	readonly node: ASTNode | null;
	readonly loc: SourceLocation | null;
	/** Previous event in the global timeline. `null` for the head event
	 *  (`step === 1`). Captured at the moment this event is added to
	 *  the list; reading is reference-stable for the event's lifetime. */
	readonly prev: LinkedInterceptEvent | null;
	/** Next event in the global timeline. `null` until the next event
	 *  arrives — including for the tail of a completed run AND for the
	 *  last event of a truncated run (cancel/fail/timeout/error
	 *  mid-stream — discriminate via `result.outcome`). For events
	 *  added incrementally (worker-emitted, streamed), backed by an
	 *  accessor; the underlying closure state mutates as events arrive,
	 *  but the event object itself is `Object.freeze`-immutable. For
	 *  events added all-at-once (early-return paths in buildEarlyResult),
	 *  a plain frozen property since the neighbor is known at build time. */
	readonly next: LinkedInterceptEvent | null;
	/** Direct reference to the `callee` subnode of `node` when `node.type
	 *  === 'CallExpression'`. For trap calls (the happy path) this is the
	 *  function-reference node — an `Identifier` for `prompt`/`alert`/
	 *  `confirm`, a `MemberExpression` for `console.log`/etc., a
	 *  parenthesized expression for `(c ? a : b)(x)`, etc. `null` when
	 *  `node` is null (no-ast) OR `node.type !== 'CallExpression'`
	 *  (residual error path attributing to a non-call node). */
	readonly callee: ASTNode | null;
	/** The `nodePath` of `callee` (when non-null) — typically
	 *  `nodePath + '.callee'`. Useful for editor highlighting that wants
	 *  to underline only the function reference, not the entire call
	 *  expression. `null` whenever `callee` is null. */
	readonly calleePath: string | null;
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
