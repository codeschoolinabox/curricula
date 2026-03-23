/**
 * @file Post-trace filtering for AranStep[].
 *
 * Filters structured steps based on user-provided options:
 * category toggles, operator/controlFlow list filters, name whitelist, range, and data stripping.
 * Re-numbers surviving steps to 1-indexed.
 *
 * @remarks
 * Operates on AranStep[] produced by postProcess — no string parsing needed.
 * Follows the same architectural pattern as sl-trace-js-klve's filter-steps.ts.
 */

import deepFreezeInPlace from '../../../../../utils/deep-freeze-in-place.js';

import type {
	AranFilterOptions,
	AranStep,
	ResolvedAranConfig,
	ResolvedNameFilter,
} from './types.js';

// ---------------------------------------------------------------------------
// Default config (all enabled)
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: ResolvedAranConfig = Object.freeze({
	variables: true,
	operators: true,
	controlFlow: true,
	functions: true,
	functionDeclarations: true,
	this: true,
	errorHandling: true,
	enterLeave: true,
	filter: Object.freeze({
		operatorsList: new Set<string>(),
		controlFlowList: new Set<string>(),
		names: new Set<string>(),
	}),
	range: Object.freeze({ start: 1, end: 100_000 }),
	data: Object.freeze({ loc: true, values: true, nodeType: true, depth: true }),
});

// ---------------------------------------------------------------------------
// fillConfig — merge user options with defaults
// ---------------------------------------------------------------------------

/**
 * Merges partial user options with defaults to produce a fully resolved config.
 *
 * Converts array-based list filters to Sets for O(1) lookup. All optional
 * fields receive their default values (all categories enabled, empty filters,
 * full range, all data fields included).
 *
 * @param options - Partial user options (from JSON Schema validation)
 * @returns Fully resolved config with no optional fields
 */
function fillConfig({
	variables,
	operators,
	controlFlow,
	functions,
	functionDeclarations,
	this: thisToggle,
	errorHandling,
	enterLeave,
	filter,
	range,
	data,
}: AranFilterOptions = {}): ResolvedAranConfig {
	const d = DEFAULT_CONFIG;

	return {
		variables: variables ?? d.variables,
		operators: operators ?? d.operators,
		controlFlow: controlFlow ?? d.controlFlow,
		functions: functions ?? d.functions,
		functionDeclarations: functionDeclarations ?? d.functionDeclarations,
		this: thisToggle ?? d.this,
		errorHandling: errorHandling ?? d.errorHandling,
		enterLeave: enterLeave ?? d.enterLeave,
		filter: {
			operatorsList: toSet(filter?.operatorsList),
			controlFlowList: toSet(filter?.controlFlowList),
			names: toSet(filter?.names),
		},
		range: {
			start: range?.start ?? d.range.start,
			end: range?.end ?? d.range.end,
		},
		data: {
			loc: data?.loc ?? d.data.loc,
			values: data?.values ?? d.data.values,
			nodeType: data?.nodeType ?? d.data.nodeType,
			depth: data?.depth ?? d.data.depth,
		},
	};
}

function toSet(list?: readonly string[]): ReadonlySet<string> {
	if (!list || list.length === 0) return new Set();
	return new Set(list);
}

// ---------------------------------------------------------------------------
// Category filter — operation → category toggle
// ---------------------------------------------------------------------------

// why: hoist can be either a variable (var) or function declaration —
// the modifier field distinguishes them
function passesCategoryFilter(
	step: AranStep,
	config: ResolvedAranConfig,
): boolean {
	if (step.operation === 'hoist') {
		return step.modifier === 'function'
			? config.functionDeclarations
			: config.variables;
	}

	const lookup = buildCategoryLookup(config);
	const value = lookup[step.operation];
	return value ?? true;
}

// why: lookup object replaces switch (linter bans switch statements)
function buildCategoryLookup(
	config: ResolvedAranConfig,
): Record<string, boolean> {
	return {
		declare: config.variables,
		read: config.variables,
		assign: config.variables,
		initialize: config.variables,
		binary: config.operators,
		unary: config.operators,
		logical: config.operators,
		conditional: config.operators,
		check: config.controlFlow,
		break: config.controlFlow,
		continue: config.controlFlow,
		call: config.functions,
		return: config.functions,
		this: config.this,
		catch: config.errorHandling,
		throw: config.errorHandling,
		enter: config.enterLeave,
		leave: config.enterLeave,
		exception: true,
		evaluate: true,
	};
}

// ---------------------------------------------------------------------------
// List filter — category-specific name/operator/modifier checks
// ---------------------------------------------------------------------------

function passesListFilter(step: AranStep, config: ResolvedAranConfig): boolean {
	const { operatorsList, controlFlowList } = config.filter;

	if (operatorsList.size > 0 && isOperatorOperation(step)) {
		return passesOperatorList(step, operatorsList);
	}
	if (controlFlowList.size > 0 && isControlFlowOperation(step)) {
		return passesControlFlowList(step, controlFlowList);
	}

	return true;
}

function passesOperatorList(
	step: AranStep,
	list: ReadonlySet<string>,
): boolean {
	if (step.operator === null) return true;
	return list.has(step.operator);
}

function passesControlFlowList(
	step: AranStep,
	list: ReadonlySet<string>,
): boolean {
	if (step.operation === 'catch' || step.operation === 'throw') {
		return list.has(step.operation);
	}
	// check steps: control type is in name (e.g. 'if', 'while', 'for-of')
	if (step.operation === 'check') {
		if (step.name === null) return true;
		return list.has(step.name);
	}
	// break/continue: not filtered by controlFlowList
	return true;
}

function isOperatorOperation(step: AranStep): boolean {
	return (
		step.operation === 'binary' ||
		step.operation === 'unary' ||
		step.operation === 'logical' ||
		step.operation === 'conditional'
	);
}

const CONTROL_FLOW_OPERATIONS = new Set([
	'check',
	'break',
	'continue',
	'catch',
	'throw',
]);

function isControlFlowOperation(step: AranStep): boolean {
	return CONTROL_FLOW_OPERATIONS.has(step.operation);
}

// ---------------------------------------------------------------------------
// Name whitelist filter
// ---------------------------------------------------------------------------

// why: empty set = keep all names, non-empty = whitelist only
function passesNameFilter(step: AranStep, names: ResolvedNameFilter): boolean {
	if (names.size === 0) return true;
	if (step.name === null) return true;
	return names.has(step.name);
}

// ---------------------------------------------------------------------------
// Range filter
// ---------------------------------------------------------------------------

// why: steps with line 0 are synthetic (default loc from postProcess) —
// they represent group children without source location, so they pass
function passesRangeFilter(
	step: AranStep,
	range: ResolvedAranConfig['range'],
): boolean {
	const { line } = step.loc.start;
	if (line === 0) return true;
	return line >= range.start && line <= range.end;
}

// ---------------------------------------------------------------------------
// Data field stripping
// ---------------------------------------------------------------------------

function stripDataFields(
	step: AranStep,
	dataConfig: ResolvedAranConfig['data'],
): AranStep {
	// why: build a new object instead of deleting — preserves immutability
	const result: Record<string, unknown> = {
		step: step.step,
		operation: step.operation,
		name: step.name,
		operator: step.operator,
		modifier: step.modifier,
	};

	if (dataConfig.values) {
		result.values = step.values;
		if ('result' in step) {
			result.result = step.result;
		}
	}
	if (dataConfig.loc) {
		result.loc = step.loc;
	}
	if (dataConfig.nodeType) {
		result.nodeType = step.nodeType;
	}
	if (dataConfig.depth) {
		result.depth = step.depth;
		result.scopeType = step.scopeType;
	}

	return result as AranStep;
}

// ---------------------------------------------------------------------------
// Re-numbering
// ---------------------------------------------------------------------------

function renumberStep(
	currentStep: AranStep,
	index: number,
	allDataEnabled: boolean,
	dataConfig: ResolvedAranConfig['data'],
): AranStep {
	const stripped = allDataEnabled
		? currentStep
		: stripDataFields(currentStep, dataConfig);
	return { ...stripped, step: index + 1 } as AranStep;
}

// ---------------------------------------------------------------------------
// Main — filterSteps
// ---------------------------------------------------------------------------

/**
 * Filters AranStep[] based on user-provided options.
 *
 * @remarks
 * Applies category toggles, depth coherence, list filters, name filters,
 * range filters, and data stripping in order. Re-numbers surviving steps
 * to 1-indexed.
 */
function filterSteps(
	steps: readonly AranStep[],
	options: AranFilterOptions = {},
): readonly AranStep[] {
	const config = fillConfig(options);
	// why: skipAboveDepth tracks depth coherence — when a step is filtered out,
	// all subsequent steps at greater depth are also skipped until we return
	// to the same or lesser depth
	let skipAboveDepth: number | null = null;

	// why: stateful filtering needs imperative loop — skipAboveDepth
	// tracks depth coherence across iterations
	const filtered: AranStep[] = [];
	for (const currentStep of steps) {
		// 1. Depth coherence: skip children of filtered groups
		if (skipAboveDepth !== null) {
			if (currentStep.depth > skipAboveDepth) continue;
			skipAboveDepth = null;
		}

		// 2. Category filter
		if (!passesCategoryFilter(currentStep, config)) {
			skipAboveDepth = currentStep.depth;
			continue;
		}

		// 3. List filter
		if (!passesListFilter(currentStep, config)) {
			skipAboveDepth = currentStep.depth;
			continue;
		}

		// 4. Name whitelist filter
		if (!passesNameFilter(currentStep, config.filter.names)) {
			skipAboveDepth = currentStep.depth;
			continue;
		}

		// 5. Range filter
		if (!passesRangeFilter(currentStep, config.range)) {
			skipAboveDepth = currentStep.depth;
			continue;
		}

		// eslint-disable-next-line functional/immutable-data
		filtered.push(currentStep);
	}

	// 6. Data stripping + re-numbering
	const allDataEnabled =
		config.data.loc &&
		config.data.values &&
		config.data.nodeType &&
		config.data.depth;

	const numbered = filtered.map((currentStep, index) =>
		renumberStep(currentStep, index, allDataEnabled, config.data),
	);

	return deepFreezeInPlace(numbered);
}

export default filterSteps;
// eslint-disable-next-line import/no-named-export
export { fillConfig };
