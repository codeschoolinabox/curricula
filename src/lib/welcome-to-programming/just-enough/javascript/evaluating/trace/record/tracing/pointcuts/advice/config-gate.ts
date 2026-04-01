/**
 * @file Config gate helpers for 2D and flat config checks.
 *
 * 2D gates (bindings, scopes, controlFlow): both kind AND event must be enabled.
 * Flat gates (literals, operators, propertyAccess, functions, templates): single boolean.
 *
 * All functions safely walk nested config with ?? fallbacks.
 */

type Config = Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> {
	return (value ?? {}) as Record<string, unknown>;
}

// --- 2D gates ---

function isScopeGateOpen(config: Config, scopeKind: string, eventType: string): boolean {
	const scopes = asRecord(config.scopes);
	const kind = asRecord(scopes.kind);
	const events = asRecord(scopes.events);
	return !!(kind[scopeKind] && events[eventType]);
}

function isBindingGateOpen(config: Config, bindingKind: string, eventType: string): boolean {
	const bindings = asRecord(config.bindings);
	const kind = asRecord(bindings.kind);
	const events = asRecord(bindings.events);
	return !!(kind[bindingKind] && events[eventType]);
}

function isControlFlowGateOpen(config: Config, flowKind: string, eventType: string): boolean {
	const controlFlow = asRecord(config.controlFlow);
	const kind = asRecord(controlFlow.kind);
	const events = asRecord(controlFlow.events);

	// 'conditional' maps to controlFlow.kind.conditionals
	if (flowKind === 'conditional') {
		return !!(kind.conditionals && events[eventType]);
	}

	// loop kinds map to controlFlow.kind.loops.{loopKind}
	const loops = asRecord(kind.loops);
	return !!(loops[flowKind] && events[eventType]);
}

// --- Flat gates ---

function isLiteralEnabled(config: Config, literalKind: string): boolean {
	const literals = asRecord(config.literals);
	return !!literals[literalKind];
}

function isOperatorEnabled(config: Config, path: string): boolean {
	const operators = asRecord(config.operators);
	const segments = path.split('.');
	let current: unknown = operators;
	for (const segment of segments) {
		current = asRecord(current)[segment];
		if (current === undefined || current === null) return false;
	}
	return !!current;
}

function isPropertyAccessEnabled(config: Config, accessKind: string): boolean {
	const propertyAccess = asRecord(config.propertyAccess);
	return !!propertyAccess[accessKind];
}

function isFunctionEnabled(config: Config, eventType: string): boolean {
	const functions = asRecord(config.functions);
	return !!functions[eventType];
}

function isTemplateEnabled(config: Config, eventType: string): boolean {
	const templates = asRecord(config.templates);
	return !!templates[eventType];
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
};
