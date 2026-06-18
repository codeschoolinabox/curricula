import type { Node, Program } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import buildNodePathMap from '../../../lib/parse-old/build-node-path-map.js';
import getChildNodes from '../../../lib/parse-old/get-child-nodes.js';
import parseProgram from '../../../lib/parse-old/parse-program.js';
import type { SourceRange } from '../../../lib/validating/types.js';

import type {
	ConformResult,
	FeatureName,
	FeatureSubset,
	FeatureViolation,
	SizeBounds,
	SizeViolation,
} from './types.js';

/**
 * The aithor's own conformance check: does an admitted JEJ program stay within
 * a requested feature subset?
 *
 * @remarks
 * Pure and sync. Parses `code` as a module (matching the level's admission
 * posture), walks the AST in document order, and emits one located
 * {@link FeatureViolation} per node whose feature is not permitted by `subset`.
 * It only ever narrows below admitted JEJ — it never re-admits and never
 * touches the level's allowlist, so a parseable construct outside the feature
 * vocabulary (a class, an arrow function) is silent here; rejecting it is
 * admission's job, not conformance's. Unparseable input cannot be certified, so
 * it yields `ok: false` with no violations and no `ast` (never throws).
 *
 * The result envelope and its violations are deep-frozen; the echoed `ast` is
 * left unfrozen because the curated repair loop reuses it.
 *
 * Size bounds narrow further: a program longer than `lines`, or deeper than
 * `complexity` (maximum control-flow nesting depth), yields a `SizeViolation`.
 * An absent bound is unbounded, and bounds are inclusive (only `actual > limit`
 * violates). Feature violations come first in document order, then size
 * violations (`lines`, then `complexity`).
 */
export default function conform(
	code: string,
	subset: FeatureSubset,
	size: SizeBounds,
): ConformResult {
	const parsed = parseProgram(code, 'module');
	if ('message' in parsed) {
		return Object.freeze({ ok: false, violations: Object.freeze([]) });
	}

	const ast: Program = parsed;
	const pathMap = buildNodePathMap(ast);
	const violations = [
		...collectFeatureViolations(ast, subset, pathMap),
		...collectSizeViolations(code, ast, size),
	];
	deepFreezeInPlace(violations);

	return Object.freeze({ ok: violations.length === 0, violations, ast });
}

/** Every gateable JEJ feature — the "all" set when `include` is empty. */
const ALL_FEATURES: readonly FeatureName[] = [
	'if',
	'while',
	'do-while',
	'for',
	'for-of',
	'break',
	'continue',
	'ternary',
	'short-circuit',
	'optional-chaining',
	'typeof',
	'in',
	'increment',
	'bitwise',
	'compound-assignment',
	'template-literal',
	'regex',
	'bigint',
	'new-date',
];

/** Node types that map to a feature by type alone (no operator inspection). */
const DIRECT_FEATURES: ReadonlyMap<string, FeatureName> = new Map([
	['IfStatement', 'if'],
	['WhileStatement', 'while'],
	['DoWhileStatement', 'do-while'],
	['ForStatement', 'for'],
	['ForOfStatement', 'for-of'],
	['BreakStatement', 'break'],
	['ContinueStatement', 'continue'],
	['ConditionalExpression', 'ternary'],
	['LogicalExpression', 'short-circuit'],
	['ChainExpression', 'optional-chaining'],
	['TemplateLiteral', 'template-literal'],
	['UpdateExpression', 'increment'],
]);

/** Binary operators that read as the `bitwise` feature. */
const BITWISE_BINARY_OPERATORS: ReadonlySet<string> = new Set([
	'&',
	'|',
	'^',
	'<<',
	'>>',
	'>>>',
]);

/**
 * The permitted feature set: an empty `include` permits all of JEJ, a non-empty
 * `include` permits only those — then `exclude` is removed from either, so on
 * overlap `exclude` wins. `include` is a ceiling, never a floor.
 */
function resolvePermitted(subset: FeatureSubset): ReadonlySet<FeatureName> {
	const base = subset.include.length > 0 ? subset.include : ALL_FEATURES;
	const excluded = new Set<FeatureName>(subset.exclude);
	return new Set(base.filter((feature) => !excluded.has(feature)));
}

/** Collects one located violation per node whose feature is not permitted. */
function collectFeatureViolations(
	ast: Program,
	subset: FeatureSubset,
	pathMap: ReadonlyMap<Node, string>,
): FeatureViolation[] {
	const permitted = resolvePermitted(subset);
	return violationsFor(ast, permitted, pathMap);
}

/** Pre-order walk: this node's violation (if any) precedes its children's. */
function violationsFor(
	node: Node,
	permitted: ReadonlySet<FeatureName>,
	pathMap: ReadonlyMap<Node, string>,
): FeatureViolation[] {
	const feature = featureForNode(node);
	const own =
		feature !== null && !permitted.has(feature)
			? [makeViolation(feature, node, pathMap)]
			: [];
	const fromChildren = getChildNodes(node).flatMap((child) =>
		violationsFor(child, permitted, pathMap),
	);
	return [...own, ...fromChildren];
}

function makeViolation(
	feature: FeatureName,
	node: Node,
	pathMap: ReadonlyMap<Node, string>,
): FeatureViolation {
	return {
		kind: 'feature',
		feature,
		message: `'${feature}' is not in the requested feature subset`,
		location: extractLocation(node),
		nodePath: pathMap.get(node) ?? '$',
	};
}

/**
 * Maps an AST node to the JEJ feature it expresses, or `null` if the node is
 * outside the feature vocabulary. Mirrors the level's allowlist detectors.
 * Optional chaining is detected at the `ChainExpression` chain root only (not
 * the inner optional `MemberExpression`), so a chain counts once.
 */
function featureForNode(node: Node): FeatureName | null {
	const direct = DIRECT_FEATURES.get(node.type);
	if (direct !== undefined) return direct;
	// Every compound form (`+=`, `&=`, `||=`, …) is the `compound-assignment`
	// feature, never `bitwise`/`short-circuit`: reference.md teaches compound
	// assignment as its own construct, distinct from the standalone operators.
	// A plain `=` is no feature.
	if (node.type === 'AssignmentExpression')
		return operatorOf(node) === '=' ? null : 'compound-assignment';
	if (node.type === 'BinaryExpression') return binaryFeature(operatorOf(node));
	if (node.type === 'UnaryExpression') return unaryFeature(operatorOf(node));
	if (node.type === 'NewExpression')
		return calleeName(node) === 'Date' ? 'new-date' : null;
	if (node.type === 'Literal') return literalFeature(node);
	return null;
}

function binaryFeature(operator: string): FeatureName | null {
	if (operator === 'in') return 'in';
	if (BITWISE_BINARY_OPERATORS.has(operator)) return 'bitwise';
	return null;
}

function unaryFeature(operator: string): FeatureName | null {
	if (operator === 'typeof') return 'typeof';
	if (operator === '~') return 'bitwise';
	return null;
}

function literalFeature(node: Node): FeatureName | null {
	const literal = node as unknown as {
		readonly regex?: unknown;
		readonly value?: unknown;
	};
	if (literal.regex !== undefined && literal.regex !== null) return 'regex';
	if (typeof literal.value === 'bigint') return 'bigint';
	return null;
}

function operatorOf(node: Node): string {
	return (node as unknown as Record<string, unknown>).operator as string;
}

function calleeName(node: Node): string | null {
	const { callee } = node as unknown as {
		readonly callee?: { readonly type?: string; readonly name?: string };
	};
	if (callee?.type !== 'Identifier') return null;
	return callee.name ?? null;
}

/** Reads a node's 1-based line / 0-based column range from its acorn `loc`. */
function extractLocation(node: Node): SourceRange {
	const { loc } = node;
	if (loc) {
		return {
			start: { line: loc.start.line, column: loc.start.column },
			end: { line: loc.end.line, column: loc.end.column },
		};
	}
	return { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } };
}

// ─── Size bounds ──────────────────────────────────────────────────────

/** One size violation per over-bound dimension: lines first, then complexity. */
function collectSizeViolations(
	code: string,
	ast: Program,
	size: SizeBounds,
): SizeViolation[] {
	const checks = [
		sizeViolation('lines', size.lines, countLines(code)),
		sizeViolation('complexity', size.complexity, maxNestingDepth(ast)),
	];
	return checks.filter(
		(violation): violation is SizeViolation => violation !== null,
	);
}

/** A violation only when a bound is set and `actual` strictly exceeds it. */
function sizeViolation(
	dimension: 'lines' | 'complexity',
	limit: number | undefined,
	actual: number,
): SizeViolation | null {
	if (limit === undefined || actual <= limit) return null;
	return {
		kind: 'size',
		dimension,
		limit,
		actual,
		message: `program ${dimension} ${actual} exceeds the limit of ${limit}`,
	};
}

/** Physical line count — `Metrics.source.lines` semantics (a trailing newline counts). */
function countLines(code: string): number {
	return code.split('\n').length;
}

/**
 * Maximum control-flow nesting depth: the most control-flow bodies enclosing
 * any node. Each of the five block-bearing constructs (`if`, `while`,
 * `do-while`, `for`, `for-of`) adds one level to its body. A ternary adds
 * nothing (a decision point, not block nesting), and an `else if` is flat — a
 * chained `IfStatement` in the `alternate` shares the chain's depth rather than
 * nesting. (The level stubs `Metrics.maxNestingDepth` to 0, so conform owns this.)
 */
function maxNestingDepth(ast: Program): number {
	return deepest(ast, 0);
}

const LOOP_TYPES: ReadonlySet<string> = new Set([
	'WhileStatement',
	'DoWhileStatement',
	'ForStatement',
	'ForOfStatement',
]);

function deepest(node: Node, depth: number): number {
	const bodies = controlFlowBodies(node);
	const childDepths = getChildNodes(node).map((child) =>
		deepest(child, bodies.has(child) ? depth + 1 : depth),
	);
	return Math.max(depth, ...childDepths);
}

/**
 * The child nodes that constitute a deeper nesting level: a loop's body, an
 * if's consequent, and a real `else` block — but never a chained else-if.
 */
function controlFlowBodies(node: Node): ReadonlySet<Node> {
	const shaped = node as unknown as {
		readonly type: string;
		readonly body?: Node;
		readonly consequent?: Node;
		readonly alternate?: Node | null;
	};
	if (LOOP_TYPES.has(shaped.type)) {
		return new Set<Node>(shaped.body ? [shaped.body] : []);
	}
	if (shaped.type === 'IfStatement') {
		const alternate = shaped.alternate ?? undefined;
		const elseBody = alternate?.type === 'IfStatement' ? undefined : alternate;
		return new Set<Node>(
			[shaped.consequent, elseBody].filter(
				(child): child is Node => child !== undefined,
			),
		);
	}
	return new Set<Node>();
}
