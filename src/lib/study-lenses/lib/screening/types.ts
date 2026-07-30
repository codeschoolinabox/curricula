/**
 * @file Canonical types for the screening module.
 *
 * The domain model in TypeScript: a curated slice of JavaScript as the data a
 * default-deny walk reads, and the located refusal that walk produces. The
 * allowlist family says what may appear; the violation family says where
 * something appeared that may not.
 *
 * The only import is acorn, type-only — the parser's own vocabulary, and the
 * leaf's whole foreign surface. Nothing here knows what a refusal is worth: a
 * violation carries no severity and no posture, because what to do about one is
 * the consumer's ruling.
 *
 * See `./README.md` for the default-deny rule, what the walk's totality is
 * relative to, and the homonyms these names collide with elsewhere in the
 * package.
 */

import type { Node } from 'acorn';

// ─────────────────────────────────────────────────────────────────────────────
// The allowlist — a curated slice of JavaScript, as data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decides whether one node of an admitted type is within the curated slice.
 *
 * @remarks
 * Legality only: it answers *what is wrong*, never *where*. The walk holds the
 * node's position and its path and constructs the violation — so a check needs
 * no position, and there is one place a source range is read rather than one
 * per rule. Returning the message rather than a violation is what keeps that
 * true.
 */
export type ConstraintCheck = (node: Node) => true | string;

/**
 * The allowlist's standing on one node type: admitted outright, or admitted
 * subject to a check.
 *
 * @remarks
 * There is no "explicitly forbidden" arm. Absence *is* refusal, so a third
 * state would say the same thing twice and invite the two to disagree.
 */
export type NodeRule = true | ConstraintCheck;

/**
 * A curated slice of JavaScript, as the data the machinery reads — and only
 * that: the node rules the walk dispatches on, and the global names a caller's
 * own vocabulary check resolves against.
 *
 * @remarks
 * Default-deny: a node type absent from `nodes` is outside the slice, so new
 * JavaScript is outside by default rather than by oversight. The totality this
 * implies is bounded by the caller's parse — the node types that parse emits,
 * not the whole grammar; a node type reachable under the caller's settings and
 * absent here is a false rejection, not a true violation. The parse goal is a
 * second bound the caller owns: a table is sound for the goal it was authored
 * against, not automatically for the other.
 *
 * Whether `admittedGlobals` is authored or derived is the curation's own
 * business; screening only reads it.
 */
export type SyntaxAllowlist = {
	readonly nodes: Readonly<Record<string, NodeRule>>;
	readonly admittedGlobals: ReadonlySet<string>;
};

// ─────────────────────────────────────────────────────────────────────────────
// The descent — a node's identity, built as the walk goes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A direct child paired with the path segment that reaches it from its parent.
 *
 * @remarks
 * An object-valued property yields its key (`'init'`); an array element yields
 * `'key.index'` where the index is the source-array position — so a hole does
 * not renumber its later siblings, and a path never moves because of one. The
 * descent joins its parent path with each segment to form a full node path as
 * it goes; paths are carried inline, never built into a separate map.
 */
export type ChildWithPath = {
	readonly child: Node;
	readonly segment: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Violations — what screening produces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Where something sits in the source, as the parser's own character offsets:
 * `start` is the first character; `end` is exclusive — one past the last.
 *
 * @remarks
 * Offsets, not line/column. Every parsed node carries them unconditionally, so
 * a violation's range is always constructible from a parsed tree alone, while
 * a line/column range would depend on a parse option no caller is compelled to
 * set. A consumer wanting line/column holds the source and counts; screening
 * never converts, having no source text of its own.
 */
export type SourceRange = {
	readonly start: number;
	readonly end: number;
};

/**
 * One place the program steps outside the curated slice.
 *
 * @remarks
 * Enough to display a message with source context AND to locate the offending
 * node (the dot-delimited node path is the package's canonical node identity).
 * A violation carries no severity: screening reports where the grammar left
 * the slice, and what that is worth — whether it blocks anything, whether it
 * is shown at all — is the consumer's ruling, never this leaf's.
 */
export type Violation = {
	readonly nodeType: string;
	readonly message: string;
	readonly location: SourceRange;
	readonly nodePath: string;
};
