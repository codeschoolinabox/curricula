import type { Node, Program } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import buildNodePathMap from '../../../lib/parse-old/build-node-path-map.js';
import getChildNodes from '../../../lib/parse-old/get-child-nodes.js';
import parseProgram from '../../../lib/parse-old/parse-program.js';
import type { SourceRange } from '../../../lib/validating/types.js';

import features from './features.js';
import metrics from './metrics.js';
import type {
	ConformResult,
	FeatureName,
	FeatureSubset,
	FeatureViolation,
	SizeBounds,
	SizeViolation,
} from './types.js';

const { ALL_FEATURES, featureForNode } = features;
const { countLines, maxNestingDepth } = metrics;

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
