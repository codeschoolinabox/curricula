import type { Node, Program } from 'acorn';

import getChildNodes from '../../../lib/parse-old/get-child-nodes.js';

import type { FeatureName } from './types.js';

/**
 * The aithor's JEJ feature vocabulary, shared between the conformance gate (which
 * narrows below it) and `vary`'s seed inventory (which reads a seed's features off
 * the SAME node→feature map). Extracted from `conform` so the inventory is the
 * gate's own detector, never a parallel one.
 */

/**
 * Every gateable JEJ feature — the "all" set when `include` is empty. Frozen at
 * the declaration: the empty-inventory exclude-all idiom aliases this array for
 * both `include` and `exclude`, so a frozen constant removes any mutation hazard.
 */
const ALL_FEATURES: readonly FeatureName[] = Object.freeze([
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
]);

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

/**
 * The seed's feature inventory: the deduped JEJ features a program actually uses,
 * the exact dual of `conform`'s `violationsFor` walk — the same pre-order
 * `getChildNodes` traversal applying the same {@link featureForNode} (so it
 * inherits the `ChainExpression`-root-only optional-chaining rule and is never a
 * parallel detector). Returned in pre-order, first-occurrence order as a fresh
 * array; every consumer is order-insensitive (`resolvePermitted` dedupes into a
 * Set, prompt rendering re-orders by phrasing).
 */
function inventoryFeatures(ast: Program): readonly FeatureName[] {
	const all = collectFeaturesPreOrder(ast);
	return all.filter((feature, index) => all.indexOf(feature) === index);
}

/**
 * Pre-order: this node's feature (if any) precedes its children's — the dedup is
 * the caller's. Mirrors `conform`'s `violationsFor` shape exactly.
 */
function collectFeaturesPreOrder(node: Node): readonly FeatureName[] {
	const feature = featureForNode(node);
	const own = feature === null ? [] : [feature];
	const fromChildren = getChildNodes(node).flatMap((child) =>
		collectFeaturesPreOrder(child),
	);
	return [...own, ...fromChildren];
}

const features = Object.freeze({
	ALL_FEATURES,
	featureForNode,
	inventoryFeatures,
});

export default features;
