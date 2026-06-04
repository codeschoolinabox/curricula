/**
 * @file Dev-time event type validator.
 *
 * Validates that emitted TraceEvents match their TypeScript type definitions.
 * Used by event-type-validation.browser.test.ts to catch field mismatches.
 * NOT a runtime validator — this is a dev pipeline tool.
 */

type ValidationResult = { valid: true } | { valid: false; errors: string[] };

function err(path: string, msg: string): string {
	return `${path}: ${msg}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// --- Value Representation ---

const VALID_VALUE_TYPES = new Set([
	'string',
	'number',
	'boolean',
	'undefined',
	'object',
	'function',
	'regexp',
]);

function validateValueRep(value: unknown, path: string): string[] {
	if (!isRecord(value))
		return [err(path, `expected object, got ${typeof value}`)];
	const type = value.type;
	if (typeof type !== 'string')
		return [err(path + '.type', `expected string, got ${typeof type}`)];
	if (!VALID_VALUE_TYPES.has(type))
		return [err(path + '.type', `unknown type '${type}'`)];

	if (type === 'undefined') return [];
	if (type === 'object' && value.isNull === true && value.value === null)
		return [];
	if (type === 'string' && typeof value.value !== 'string')
		return [err(path + '.value', 'expected string')];
	if (type === 'number' && typeof value.value !== 'number')
		return [err(path + '.value', 'expected number')];
	if (type === 'boolean' && typeof value.value !== 'boolean')
		return [err(path + '.value', 'expected boolean')];
	if (type === 'function' && typeof value.name !== 'string')
		return [err(path + '.name', 'expected string')];
	if (type === 'regexp') {
		if (typeof value.pattern !== 'string')
			return [err(path + '.pattern', 'expected string')];
		if (typeof value.flags !== 'string')
			return [err(path + '.flags', 'expected string')];
	}
	return [];
}

function validateOptionalValueRep(value: unknown, path: string): string[] {
	if (value === undefined) return [];
	return validateValueRep(value, path);
}

function validateValueRepArray(arr: unknown, path: string): string[] {
	if (!Array.isArray(arr))
		return [err(path, `expected array, got ${typeof arr}`)];
	const errors: string[] = [];
	for (let i = 0; i < arr.length; i++) {
		errors.push(...validateValueRep(arr[i], `${path}[${i}]`));
	}
	return errors;
}

// --- Source Location ---

function validateLoc(loc: unknown, path: string): string[] {
	if (!isRecord(loc)) return [err(path, 'expected object')];
	const errors: string[] = [];
	for (const end of ['start', 'end'] as const) {
		const pos = loc[end];
		if (!isRecord(pos)) {
			errors.push(err(`${path}.${end}`, 'expected object'));
			continue;
		}
		if (typeof pos.line !== 'number')
			errors.push(err(`${path}.${end}.line`, 'expected number'));
		if (typeof pos.column !== 'number')
			errors.push(err(`${path}.${end}.column`, 'expected number'));
	}
	return errors;
}

// --- Base Event ---

function validateBase(e: Record<string, unknown>): string[] {
	const errors: string[] = [];
	if (typeof e.step !== 'number')
		errors.push(err('step', `expected number, got ${typeof e.step}`));
	if (e.semantics !== 'statement' && e.semantics !== 'expression')
		errors.push(
			err(
				'semantics',
				`expected 'statement'|'expression', got '${e.semantics}'`,
			),
		);
	errors.push(...validateLoc(e.loc, 'loc'));
	if (typeof e.node !== 'string')
		errors.push(err('node', `expected string, got ${typeof e.node}`));
	if (typeof e.source !== 'string')
		errors.push(err('source', `expected string, got ${typeof e.source}`));
	return errors;
}

// --- Category validators ---

const BINDING_KINDS = new Set(['let', 'const', 'global']);
const BINDING_EVENTS = new Set([
	'declare',
	'initialize',
	'available',
	'assign',
	'read',
]);

function validateBinding(e: Record<string, unknown>): string[] {
	const errors: string[] = [];
	if (!BINDING_KINDS.has(e.kind as string))
		errors.push(err('kind', `expected let|const|global, got '${e.kind}'`));
	if (!BINDING_EVENTS.has(e.event as string))
		errors.push(err('event', `expected binding event type, got '${e.event}'`));
	if (typeof e.name !== 'string')
		errors.push(err('name', `expected string, got ${typeof e.name}`));
	if (
		e.scopeCreationStep !== undefined &&
		typeof e.scopeCreationStep !== 'number'
	)
		errors.push(err('scopeCreationStep', 'expected number'));
	if (e.declarationStep !== undefined && typeof e.declarationStep !== 'number')
		errors.push(err('declarationStep', 'expected number'));
	errors.push(...validateOptionalValueRep(e.value, 'value'));
	if (e.explicit !== undefined && typeof e.explicit !== 'boolean')
		errors.push(err('explicit', 'expected boolean'));
	return errors;
}

const PROPERTY_ACCESS_KINDS = new Set(['dot', 'bracket', 'optionalChaining']);

function validatePropertyAccess(e: Record<string, unknown>): string[] {
	const errors: string[] = [];
	if (!PROPERTY_ACCESS_KINDS.has(e.kind as string))
		errors.push(
			err('kind', `expected dot|bracket|optionalChaining, got '${e.kind}'`),
		);
	errors.push(...validateValueRep(e.object, 'object'));
	if (typeof e.key !== 'string' && typeof e.key !== 'number')
		errors.push(err('key', `expected string|number, got ${typeof e.key}`));
	errors.push(...validateValueRep(e.value, 'value'));
	if (e.shortCircuited !== undefined && e.shortCircuited !== true)
		errors.push(err('shortCircuited', 'expected true'));
	return errors;
}

const PURE_SUBKINDS = new Set([
	'arithmetic',
	'addition',
	'comparison',
	'typeof',
	'negation.logical',
	'negation.bitwise',
	'bitwise',
]);

function validateOperator(e: Record<string, unknown>): string[] {
	const errors: string[] = [];
	const kind = e.kind;

	if (kind === 'pure') {
		if (!PURE_SUBKINDS.has(e.subkind as string))
			errors.push(err('subkind', `expected pure subkind, got '${e.subkind}'`));
		if (typeof e.operator !== 'string')
			errors.push(err('operator', 'expected string'));
		errors.push(...validateValueRepArray(e.operands, 'operands'));
		errors.push(...validateValueRep(e.result, 'result'));
		if (e.coercion !== undefined)
			errors.push(...validateValueRepArray(e.coercion, 'coercion'));
	} else if (kind === 'shortCircuiting') {
		if (typeof e.operator !== 'string')
			errors.push(err('operator', 'expected string'));
		errors.push(...validateValueRep(e.left, 'left'));
		errors.push(...validateValueRep(e.result, 'result'));
		errors.push(...validateOptionalValueRep(e.right, 'right'));
		if (e.shortCircuited !== undefined && e.shortCircuited !== true)
			errors.push(err('shortCircuited', 'expected true'));
	} else if (kind === 'assignment') {
		if (typeof e.operator !== 'string')
			errors.push(err('operator', 'expected string'));
		if (typeof e.target !== 'string')
			errors.push(err('target', 'expected string'));
		errors.push(...validateValueRepArray(e.operands, 'operands'));
		errors.push(...validateValueRep(e.result, 'result'));
	} else {
		errors.push(
			err('kind', `expected pure|shortCircuiting|assignment, got '${kind}'`),
		);
	}
	return errors;
}

const LITERAL_KINDS = new Set([
	'string',
	'boolean',
	'number',
	'undefined',
	'null',
	'regex',
]);

function validateLiteral(e: Record<string, unknown>): string[] {
	const errors: string[] = [];
	if (!LITERAL_KINDS.has(e.kind as string))
		errors.push(err('kind', `expected literal kind, got '${e.kind}'`));
	errors.push(...validateValueRep(e.value, 'value'));
	return errors;
}

function validateTemplate(e: Record<string, unknown>): string[] {
	const errors: string[] = [];
	const event = e.event;
	if (event === 'begin') {
		if (!Array.isArray(e.strings))
			errors.push(err('strings', 'expected array'));
		if (typeof e.expressionCount !== 'number')
			errors.push(err('expressionCount', 'expected number'));
	} else if (event === 'evaluation') {
		if (typeof e.index !== 'number')
			errors.push(err('index', 'expected number'));
		errors.push(...validateValueRep(e.value, 'value'));
		if (typeof e.beginStep !== 'number')
			errors.push(err('beginStep', 'expected number'));
	} else if (event === 'end') {
		errors.push(...validateValueRep(e.value, 'value'));
		if (typeof e.beginStep !== 'number')
			errors.push(err('beginStep', 'expected number'));
	} else {
		errors.push(err('event', `expected begin|evaluation|end, got '${event}'`));
	}
	return errors;
}

const SCOPE_KINDS = new Set(['script', 'block', 'module']);
const SCOPE_EVENTS = new Set([
	'create',
	'enter',
	'interrupt',
	'completion',
	'leave',
]);

function validateScope(e: Record<string, unknown>): string[] {
	const errors: string[] = [];
	if (!SCOPE_KINDS.has(e.kind as string))
		errors.push(err('kind', `expected scope kind, got '${e.kind}'`));
	if (!SCOPE_EVENTS.has(e.event as string))
		errors.push(err('event', `expected scope event, got '${e.event}'`));
	if (typeof e.depth !== 'number') errors.push(err('depth', 'expected number'));
	if (typeof e.creationStep !== 'number')
		errors.push(err('creationStep', 'expected number'));
	if (
		e.parentCreationStep !== undefined &&
		typeof e.parentCreationStep !== 'number'
	)
		errors.push(err('parentCreationStep', 'expected number'));
	if (e.structureStep !== undefined && typeof e.structureStep !== 'number')
		errors.push(err('structureStep', 'expected number'));
	return errors;
}

const CF_KINDS = new Set(['conditional', 'while', 'doWhile', 'for', 'forOf']);

function validateControlFlow(e: Record<string, unknown>): string[] {
	const errors: string[] = [];
	const event = e.event;

	if (event === 'test') {
		if (!CF_KINDS.has(e.kind as string))
			errors.push(err('kind', `expected CF kind, got '${e.kind}'`));
		errors.push(...validateValueRep(e.value, 'value'));
		if (typeof e.result !== 'boolean')
			errors.push(err('result', 'expected boolean'));
		errors.push(...validateOptionalValueRep(e.coercion, 'coercion'));
	} else if (event === 'branch') {
		if (e.kind !== 'conditional')
			errors.push(err('kind', `expected 'conditional', got '${e.kind}'`));
		if (!['consequent', 'alternate', 'none'].includes(e.branch as string))
			errors.push(err('branch', `unexpected value '${e.branch}'`));
	} else if (event === 'iteration') {
		if (typeof e.index !== 'number')
			errors.push(err('index', 'expected number'));
	} else if (event === 'jump') {
		if (e.kind !== 'break' && e.kind !== 'continue')
			errors.push(err('kind', `expected break|continue, got '${e.kind}'`));
	} else if (event === 'do') {
		if (e.kind !== 'doWhile')
			errors.push(err('kind', `expected doWhile, got '${e.kind}'`));
	} else if (event === 'initialize') {
		if (e.kind !== 'for')
			errors.push(err('kind', `expected for, got '${e.kind}'`));
	} else if (event === 'increment') {
		if (e.kind !== 'for')
			errors.push(err('kind', `expected for, got '${e.kind}'`));
	} else {
		errors.push(err('event', `unknown controlFlow event '${event}'`));
	}
	return errors;
}

function validateFunction(e: Record<string, unknown>): string[] {
	const errors: string[] = [];
	if (e.event === 'call') {
		if (typeof e.name !== 'string') errors.push(err('name', 'expected string'));
		errors.push(...validateValueRepArray(e.args, 'args'));
	} else if (e.event === 'return') {
		if (typeof e.name !== 'string') errors.push(err('name', 'expected string'));
		errors.push(...validateValueRep(e.value, 'value'));
	} else {
		errors.push(err('event', `expected call|return, got '${e.event}'`));
	}
	return errors;
}

function validateWith(e: Record<string, unknown>): string[] {
	const errors: string[] = [];
	if (e.event !== 'enter' && e.event !== 'leave')
		errors.push(err('event', `expected enter|leave, got '${e.event}'`));
	errors.push(...validateValueRep(e.object, 'object'));
	return errors;
}

// --- Main validator ---

const CATEGORIES = new Set([
	'binding',
	'propertyAccess',
	'operator',
	'literal',
	'template',
	'scope',
	'controlFlow',
	'function',
	'with',
]);

function validateEvent(event: unknown): ValidationResult {
	if (!isRecord(event))
		return { valid: false, errors: ['event is not an object'] };

	const e = event as Record<string, unknown>;
	const errors: string[] = [];

	errors.push(...validateBase(e));

	const category = e.category;
	if (typeof category !== 'string' || !CATEGORIES.has(category)) {
		errors.push(err('category', `unknown category '${category}'`));
		return errors.length === 0 ? { valid: true } : { valid: false, errors };
	}

	if (category === 'binding') errors.push(...validateBinding(e));
	else if (category === 'propertyAccess')
		errors.push(...validatePropertyAccess(e));
	else if (category === 'operator') errors.push(...validateOperator(e));
	else if (category === 'literal') errors.push(...validateLiteral(e));
	else if (category === 'template') errors.push(...validateTemplate(e));
	else if (category === 'scope') errors.push(...validateScope(e));
	else if (category === 'controlFlow') errors.push(...validateControlFlow(e));
	else if (category === 'function') errors.push(...validateFunction(e));
	else if (category === 'with') errors.push(...validateWith(e));

	return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

export default validateEvent;
