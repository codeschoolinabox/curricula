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
import statementBefore from './advice/statement-before.js';

import deepFreezeInPlace from '../../../../../../../../utils/deep-freeze-in-place.js';

import type { TracerState } from './types.js';

type PointcutEntry = {
	readonly kind: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Aran's flexible API uses heterogeneous signatures per hook kind
	readonly pointcut: (...args: any[]) => unknown[] | null | undefined;
};

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

	return !!(bindingEvents.assign || operators.assignment);
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
 * @returns Separated pointcut config, advice globals, and initial state
 */
function createAspect(config: Record<string, unknown>): AspectResult {
	const pointcut: Record<string, PointcutEntry> = {};
	const adviceGlobals: Record<string, Function> = {};

	// --- Always: scope tracking hooks ---

	pointcut['_jej_block_setup'] = { kind: 'block@setup', pointcut: blockPointcut };
	adviceGlobals['_jej_block_setup'] = blockSetup;

	pointcut['_jej_block_declaration'] = { kind: 'block@declaration', pointcut: blockPointcut };
	adviceGlobals['_jej_block_declaration'] = blockDeclaration;

	pointcut['_jej_block_teardown'] = { kind: 'block@teardown', pointcut: blockPointcut };
	adviceGlobals['_jej_block_teardown'] = blockTeardown;

	// --- Always: block@before (handles BranchEvent, IterationEvent, DoEvent, loop guard) ---

	pointcut['_jej_block_before'] = { kind: 'block@before', pointcut: blockPointcut };
	adviceGlobals['_jej_block_before'] = blockBefore;

	// --- Conditionally: scope event dispatch (block@after, block@throwing) ---

	if (isAnyScopeDispatchEnabled(config)) {
		pointcut['_jej_block_after'] = { kind: 'block@after', pointcut: blockPointcut };
		adviceGlobals['_jej_block_after'] = blockAfter;

		pointcut['_jej_block_throwing'] = { kind: 'block@throwing', pointcut: blockPointcut };
		adviceGlobals['_jej_block_throwing'] = blockThrowing;
	}

	// --- Conditionally: expression@after ---

	if (isAnyExpressionEnabled(config)) {
		const expressionPointcut = createExpressionPointcut(config);
		pointcut['_jej_expression_after'] = { kind: 'expression@after', pointcut: expressionPointcut };
		adviceGlobals['_jej_expression_after'] = expressionAfter;
	}

	// --- Conditionally: apply@around (single handler) ---

	if (isAnyApplyEnabled(config)) {
		pointcut['_jej_apply_around'] = { kind: 'apply@around', pointcut: applyPointcut };
		adviceGlobals['_jej_apply_around'] = applyAround;
	}

	// --- Conditionally: effect hooks ---

	if (isAnyEffectEnabled(config)) {
		const effectPointcut = createEffectPointcut(config);
		pointcut['_jej_effect_before'] = { kind: 'effect@before', pointcut: effectPointcut };
		adviceGlobals['_jej_effect_before'] = effectBefore;
	}

	// --- Conditionally: statement hooks (BreakStatement only) ---

	if (isAnyStatementEnabled(config)) {
		const stmtPointcut = createStatementPointcut(config);
		pointcut['_jej_statement_before'] = { kind: 'statement@before', pointcut: stmtPointcut };
		adviceGlobals['_jej_statement_before'] = statementBefore;
	}

	// --- Initial state ---

	const initialState: TracerState = {
		trace: [],
		step: 0,
		scopeStack: [],
		iterationCounters: {},
		lastExpressionResult: null,
		previousExpressionResult: null,
		lastReadValues: {},
		config: config,
	};

	return deepFreezeInPlace({ pointcut, adviceGlobals, initialState }) as AspectResult;
}

export default createAspect;
