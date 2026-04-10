/**
 * @file Pure config gate predicates — "is this advice path enabled by current config?"
 *
 * Three gate kinds:
 *
 * **Leaf gates** (isScopeGateOpen, isBindingGateOpen, isControlFlowGateOpen,
 * isLiteralEnabled, isOperatorEnabled, isPropertyAccessEnabled, isFunctionEnabled,
 * isTemplateEnabled): check one or two config flags, optionally filtered by item
 * name. Always return boolean, never throw.
 *
 * **Composite gates** (isAnyExpressionEnabled, isAnyApplyEnabled, isAnyEffectEnabled,
 * isAnyStatementEnabled, isAnyScopeDispatchEnabled): OR-aggregations used at
 * pointcut-weave time to decide whether to register a hook at all. Extracted from
 * `create-aspect.ts` where they lived as local helpers.
 *
 * **Internal helpers** (asRecord, passesFilter): safe config access and filter
 * checking — not exported.
 *
 * **Bounded context**: takes config + context parameters (kind strings, event type
 * strings, item names), returns boolean. No side effects, no state, no mutations.
 * Does NOT decide what to emit — only whether to.
 *
 * **Schema note**: extracted against the current advice code. Config paths reflect the
 * pre-migration schema (e.g. `config.resolve.independent`). A future schema migration
 * will unify paths to `resolve.kinds.*` and `resolve.dependent`. This file is the
 * single change point for that migration.
 */

type Config = Record<string, unknown>;

// --- Internal helpers ---

function asRecord(value: unknown): Record<string, unknown> {
	return (value ?? {}) as Record<string, unknown>;
}

function passesFilter(config: Record<string, unknown>, itemName?: string): boolean {
	const filter = config.filter as unknown[] | undefined;
	if (!filter || filter.length === 0) return true;
	if (itemName === undefined) return true;
	return filter.includes(itemName);
}

// --- 2D leaf gates ---

function isScopeGateOpen(config: Config, scopeKind: string, eventType: string): boolean {
	const scopes = asRecord(config.scopes);
	const kind = asRecord(scopes.kind);
	const events = asRecord(scopes.events);
	return !!(kind[scopeKind] && events[eventType]);
}

function isBindingGateOpen(
	config: Config,
	bindingKind: string,
	eventType: string,
	varName?: string,
): boolean {
	const bindings = asRecord(config.bindings);
	const kind = asRecord(bindings.kind);
	const events = asRecord(bindings.events);
	return !!(kind[bindingKind] && events[eventType]) && passesFilter(bindings, varName);
}

function isControlFlowGateOpen(
	config: Config,
	flowKind: string,
	eventType: string,
): boolean {
	const controlFlow = asRecord(config.controlFlow);
	const kind = asRecord(controlFlow.kind);
	const events = asRecord(controlFlow.events);

	if (flowKind === 'conditional') {
		return !!(kind.conditionals && events[eventType]) && passesFilter(controlFlow, flowKind);
	}

	const loops = asRecord(kind.loops);
	return !!(loops[flowKind] && events[eventType]) && passesFilter(controlFlow, flowKind);
}

// --- Flat leaf gates ---

function isLiteralEnabled(config: Config, literalKind: string): boolean {
	const literals = asRecord(config.literals);
	return !!literals[literalKind];
}

function isOperatorEnabled(config: Config, path: string, operatorName?: string): boolean {
	const operators = asRecord(config.operators);
	const segments = path.split('.');
	let current: unknown = operators;
	for (const segment of segments) {
		current = asRecord(current)[segment];
		if (current === undefined || current === null) return false;
	}
	return !!current && passesFilter(operators, operatorName);
}

function isPropertyAccessEnabled(
	config: Config,
	accessKind: string,
	propertyName?: string,
): boolean {
	const propertyAccess = asRecord(config.propertyAccess);
	return !!propertyAccess[accessKind] && passesFilter(propertyAccess, propertyName);
}

function isFunctionEnabled(
	config: Config,
	eventType: string,
	functionName?: string,
): boolean {
	const functions = asRecord(config.functions);
	return !!functions[eventType] && passesFilter(functions, functionName);
}

function isTemplateEnabled(config: Config, eventType: string): boolean {
	const templates = asRecord(config.templates);
	return !!templates[eventType];
}

// --- Composite gates (used at pointcut-weave time in create-aspect.ts) ---

/**
 * Whether any expression-level dispatch is enabled.
 * Used to decide whether to register the expression@after hook.
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
 * Whether any apply-level dispatch is enabled.
 * Used to decide whether to register the apply@around hook.
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
 * Whether any effect-level dispatch is enabled.
 * Used to decide whether to register the effect@before and effect@after hooks.
 *
 * WHY initialize/available: TDZ variables fire initialize and available from
 * effect-after even when assign is disabled. The effect hooks must be registered
 * to handle these lifecycle events.
 */
function isAnyEffectEnabled(config: Record<string, unknown>): boolean {
	const bindings = (config.bindings ?? {}) as Record<string, unknown>;
	const bindingEvents = (bindings.events ?? {}) as Record<string, unknown>;
	const operators = (config.operators ?? {}) as Record<string, unknown>;

	return !!(
		bindingEvents.assign ||
		bindingEvents.initialize ||
		bindingEvents.available ||
		operators.assignment
	);
}

/**
 * Whether any statement-level dispatch is enabled.
 * Used to decide whether to register the statement@before hook.
 */
function isAnyStatementEnabled(config: Record<string, unknown>): boolean {
	const controlFlow = (config.controlFlow ?? {}) as Record<string, unknown>;
	const controlFlowEvents = (controlFlow.events ?? {}) as Record<string, unknown>;

	return !!controlFlowEvents.jump;
}

/**
 * Whether any scope event dispatch is enabled.
 * Used to decide whether to register block@after and block@throwing.
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

export {
	isScopeGateOpen,
	isBindingGateOpen,
	isControlFlowGateOpen,
	isLiteralEnabled,
	isOperatorEnabled,
	isPropertyAccessEnabled,
	isFunctionEnabled,
	isTemplateEnabled,
	isAnyExpressionEnabled,
	isAnyApplyEnabled,
	isAnyEffectEnabled,
	isAnyStatementEnabled,
	isAnyScopeDispatchEnabled,
};
