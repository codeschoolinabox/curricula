/**
 * @file Builds Aran flexible aspect from user config.
 *
 * Returns separate pointcut config (for weave()) and advice globals (for
 * runtime registration). The caller is responsible for:
 * 1. Passing { initial_state, pointcut } to Aran's weave()
 * 2. Registering advice globals on the execution environment
 *
 * @remarks
 * Scope tracking hooks (block@setup, block@declaration, block@teardown) are
 * always included because binding events need scope references even when
 * scope events are disabled.
 */

import blockPointcut from './pointcut/block-pointcut.js';
import applyPointcut from './pointcut/apply-pointcut.js';
import createExpressionPointcut from './pointcut/expression-pointcut.js';
import createEffectPointcut from './pointcut/effect-pointcut.js';
import createStatementPointcut from './pointcut/statement-pointcut.js';

import blockSetup from './advice/block-setup.js';
import blockBefore from './advice/block-before.js';
import blockDeclaration from './advice/block-declaration.js';
import blockAfter from './advice/block-after.js';
import blockThrowing from './advice/block-throwing.js';
import blockTeardown from './advice/block-teardown.js';
import expressionAfter from './advice/expression-after.js';
import applyAround from './advice/apply-around.js';
import effectBefore from './advice/effect-before.js';
import effectAfterAdvice from './advice/effect-after.js';
import statementBefore from './advice/statement-before.js';

import deepFreezeInPlace from '../../../../../../../../utils/deep-freeze-in-place.js';

import type { JejTag, TracerState } from './types.js';

type PointcutEntry = {
	readonly kind: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Aran's flexible API uses heterogeneous signatures per hook kind
	readonly pointcut: (...args: any[]) => unknown[] | null | undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- AranLang nodes have dynamic shape
type AranNode = any;

/**
 * Resolves a hash-string tag to a JejTag from the tag map.
 * Throws if the hash is not found — indicates a digest/pre-walk bug.
 */
function resolveTag(hash: unknown, tagMap: Map<string, JejTag>): JejTag | unknown {
	if (typeof hash !== 'string') return hash;
	const resolved = tagMap.get(hash);
	if (resolved === undefined) {
		throw new Error(`Tag map lookup failed for hash: ${hash}. This indicates a digest bug.`);
	}
	return resolved;
}

/**
 * Resolves .tag properties on an AranLang node using the tag map.
 * Returns a shallow copy with .tag replaced. Does NOT mutate the original.
 */
function resolveNodeTags(node: AranNode, tagMap: Map<string, JejTag>): AranNode {
	if (node === null || node === undefined) return node;
	if (typeof node !== 'object') return node;
	if (typeof node.tag !== 'string') return node;

	// Shallow copy with resolved tag
	return { ...node, tag: resolveTag(node.tag, tagMap) };
}

/**
 * Resolves .tag on a parent node AND its known nested positions.
 *
 * Whitelist: parent.tag, parent.then?.tag, parent.else?.tag,
 * parent.try?.tag, parent.catch?.tag, parent.finally?.tag
 *
 * WHY whitelist: block-pointcut.ts uses `parent.then?.tag === node.tag`
 * for branch identification. Both sides must be resolved for identity
 * comparison to work. tagMap.get() returns the same object reference
 * for the same hash, preserving ===.
 */
function resolveParentTags(parent: AranNode, tagMap: Map<string, JejTag>): AranNode {
	if (parent === null || parent === undefined) return parent;
	if (typeof parent !== 'object') return parent;

	const copy = { ...parent };

	if (typeof copy.tag === 'string') {
		copy.tag = resolveTag(copy.tag, tagMap);
	}

	// Nested positions used in identity comparisons (block-pointcut.ts, expression-pointcut.ts)
	if (copy.test && typeof copy.test.tag === 'string') {
		copy.test = { ...copy.test, tag: resolveTag(copy.test.tag, tagMap) };
	}
	if (copy.then && typeof copy.then.tag === 'string') {
		copy.then = { ...copy.then, tag: resolveTag(copy.then.tag, tagMap) };
	}
	if (copy.else && typeof copy.else.tag === 'string') {
		copy.else = { ...copy.else, tag: resolveTag(copy.else.tag, tagMap) };
	}
	if (copy.try && typeof copy.try.tag === 'string') {
		copy.try = { ...copy.try, tag: resolveTag(copy.try.tag, tagMap) };
	}
	if (copy.catch && typeof copy.catch.tag === 'string') {
		copy.catch = { ...copy.catch, tag: resolveTag(copy.catch.tag, tagMap) };
	}
	if (copy.finally && typeof copy.finally.tag === 'string') {
		copy.finally = { ...copy.finally, tag: resolveTag(copy.finally.tag, tagMap) };
	}

	return copy;
}

/**
 * Wraps a pointcut function to resolve hash-string tags to JejTag objects.
 *
 * Aran's digest produces hash strings as tags. Pointcut functions expect
 * JejTag objects. This wrapper bridges the two by resolving tags on node,
 * parent, and root before calling the original pointcut.
 */
function wrapPointcut(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- original pointcut has heterogeneous signature
	originalPointcut: (...args: any[]) => unknown[] | null | undefined,
	tagMap: Map<string, JejTag>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- must match Aran's pointcut signature
): (...args: any[]) => unknown[] | null | undefined {
	return function wrappedPointcut(node: AranNode, parent: AranNode, root: AranNode) {
		return originalPointcut(
			resolveNodeTags(node, tagMap),
			resolveParentTags(parent, tagMap),
			resolveNodeTags(root, tagMap),
		);
	};
}

type AspectResult = {
	readonly pointcut: Record<string, PointcutEntry>;
	readonly adviceGlobals: Record<string, Function>;
	readonly initialState: TracerState;
};

/**
 * Checks if any expression-level dispatch is enabled.
 */
function isAnyExpressionEnabled(config: Record<string, unknown>): boolean {
	const literals = (config.literals ?? {}) as Record<string, unknown>;
	const bindings = (config.bindings ?? {}) as Record<string, unknown>;
	const bindingEvents = (bindings.events ?? {}) as Record<string, unknown>;
	const operators = (config.operators ?? {}) as Record<string, unknown>;
	const controlFlow = (config.controlFlow ?? {}) as Record<string, unknown>;
	const controlFlowEvents = (controlFlow.events ?? {}) as Record<string, unknown>;

	return !!(
		literals.string ||
		literals.number ||
		literals.boolean ||
		literals.null ||
		literals.undefined ||
		literals.regex ||
		bindingEvents.read ||
		operators.shortCircuiting ||
		controlFlowEvents.test
	);
}

/**
 * Checks if any apply-level dispatch is enabled.
 */
function isAnyApplyEnabled(config: Record<string, unknown>): boolean {
	const operators = (config.operators ?? {}) as Record<string, unknown>;
	const pure = (operators.pure ?? {}) as Record<string, unknown>;
	const negation = (pure.negation ?? {}) as Record<string, unknown>;
	const propertyAccess = (config.propertyAccess ?? {}) as Record<string, unknown>;
	const functions = (config.functions ?? {}) as Record<string, unknown>;
	const templates = (config.templates ?? {}) as Record<string, unknown>;

	return !!(
		pure.arithmetic ||
		pure.addition ||
		pure.comparison ||
		pure.typeof ||
		pure.bitwise ||
		negation.logical ||
		negation.bitwise ||
		operators.shortCircuiting ||
		operators.assignment ||
		propertyAccess.dot ||
		propertyAccess.bracket ||
		propertyAccess.optionalChaining ||
		functions.call ||
		functions.return ||
		templates.begin ||
		templates.evaluation ||
		templates.end
	);
}

/**
 * Checks if any effect-level dispatch is enabled.
 */
function isAnyEffectEnabled(config: Record<string, unknown>): boolean {
	const bindings = (config.bindings ?? {}) as Record<string, unknown>;
	const bindingEvents = (bindings.events ?? {}) as Record<string, unknown>;
	const operators = (config.operators ?? {}) as Record<string, unknown>;

	// WHY initialize/available: these events fire from effect-after (the
	// first write to a TDZ variable). They need the effect hooks registered
	// even when assign is disabled.
	return !!(bindingEvents.assign || bindingEvents.initialize || bindingEvents.available || operators.assignment);
}

/**
 * Checks if any statement-level dispatch is enabled.
 */
function isAnyStatementEnabled(config: Record<string, unknown>): boolean {
	const controlFlow = (config.controlFlow ?? {}) as Record<string, unknown>;
	const controlFlowEvents = (controlFlow.events ?? {}) as Record<string, unknown>;

	return !!controlFlowEvents.jump;
}

/**
 * Checks if any scope event dispatch is enabled.
 */
function isAnyScopeDispatchEnabled(config: Record<string, unknown>): boolean {
	const scopes = (config.scopes ?? {}) as Record<string, unknown>;
	const scopeEvents = (scopes.events ?? {}) as Record<string, unknown>;

	return !!(
		scopeEvents.create ||
		scopeEvents.enter ||
		scopeEvents.completion ||
		scopeEvents.interrupt ||
		scopeEvents.leave
	);
}

/**
 * Builds an Aran flexible aspect from user config.
 *
 * @param config - The user's trace config (from options.schema.json)
 * @param tagMap - Map of hash strings → JejTag objects, built by instrument()'s
 *   digest callback. Optional — defaults to empty Map for backward compatibility
 *   with unit tests that don't use the full instrumentation pipeline.
 * @returns Separated pointcut config, advice globals, and initial state
 */
function createAspect(
	config: Record<string, unknown>,
	tagMap: Map<string, JejTag> = new Map(),
	variableKinds: Record<string, 'let' | 'const'> = {},
): AspectResult {
	const pointcut: Record<string, PointcutEntry> = {};
	const adviceGlobals: Record<string, Function> = {};

	// WHY wrap: Aran's digest produces hash strings as tags. Pointcut functions
	// expect JejTag objects. wrapPointcut resolves hashes → JejTags before
	// calling the original pointcut. When tagMap is empty (unit tests), tags
	// pass through as-is (resolveTag returns the original value for non-strings).
	const wrap = tagMap.size > 0
		? function withResolution(fn: PointcutEntry['pointcut']) { return wrapPointcut(fn, tagMap); }
		: function passthrough(fn: PointcutEntry['pointcut']) { return fn; };

	// --- Always: scope tracking hooks ---

	pointcut['_jej_block_setup'] = { kind: 'block@setup', pointcut: wrap(blockPointcut) };
	adviceGlobals['_jej_block_setup'] = blockSetup;

	pointcut['_jej_block_declaration'] = { kind: 'block@declaration', pointcut: wrap(blockPointcut) };
	adviceGlobals['_jej_block_declaration'] = blockDeclaration;

	pointcut['_jej_block_teardown'] = { kind: 'block@teardown', pointcut: wrap(blockPointcut) };
	adviceGlobals['_jej_block_teardown'] = blockTeardown;

	// --- Always: block@before (handles BranchEvent, IterationEvent, DoEvent, loop guard) ---

	pointcut['_jej_block_before'] = { kind: 'block@before', pointcut: wrap(blockPointcut) };
	adviceGlobals['_jej_block_before'] = blockBefore;

	// --- Conditionally: scope event dispatch (block@after, block@throwing) ---

	if (isAnyScopeDispatchEnabled(config)) {
		pointcut['_jej_block_after'] = { kind: 'block@after', pointcut: wrap(blockPointcut) };
		adviceGlobals['_jej_block_after'] = blockAfter;

		pointcut['_jej_block_throwing'] = { kind: 'block@throwing', pointcut: wrap(blockPointcut) };
		adviceGlobals['_jej_block_throwing'] = blockThrowing;
	}

	// --- Conditionally: expression@after ---

	if (isAnyExpressionEnabled(config)) {
		const expressionPointcut = createExpressionPointcut(config);
		pointcut['_jej_expression_after'] = { kind: 'expression@after', pointcut: wrap(expressionPointcut) };
		adviceGlobals['_jej_expression_after'] = expressionAfter;
	}

	// --- Conditionally: apply@around (single handler) ---

	if (isAnyApplyEnabled(config)) {
		pointcut['_jej_apply_around'] = { kind: 'apply@around', pointcut: wrap(applyPointcut) };
		adviceGlobals['_jej_apply_around'] = applyAround;
	}

	// --- Conditionally: effect hooks ---

	if (isAnyEffectEnabled(config)) {
		const effectPointcut = createEffectPointcut(config);
		pointcut['_jej_effect_before'] = { kind: 'effect@before', pointcut: wrap(effectPointcut) };
		adviceGlobals['_jej_effect_before'] = effectBefore;

		pointcut['_jej_effect_after'] = { kind: 'effect@after', pointcut: wrap(effectPointcut) };
		adviceGlobals['_jej_effect_after'] = effectAfterAdvice;
	}

	// --- Conditionally: statement hooks (BreakStatement only) ---

	if (isAnyStatementEnabled(config)) {
		const stmtPointcut = createStatementPointcut(config);
		pointcut['_jej_statement_before'] = { kind: 'statement@before', pointcut: wrap(stmtPointcut) };
		adviceGlobals['_jej_statement_before'] = statementBefore;
	}

	// --- Initial state ---

	const initialState: TracerState = {
		trace: [],
		step: 0,
		eventStep: 0,
		scopeStack: [],
		iterationCounters: {},
		lastExpressionResult: null,
		previousExpressionResult: null,
		lastReadValues: {},
		config: config,
		variableKinds: variableKinds,
	};

	return deepFreezeInPlace({ pointcut, adviceGlobals, initialState }) as AspectResult;
}

export default createAspect;
