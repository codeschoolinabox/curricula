/**
 * @file Transforms raw trace entries from traceCollector into AranStep[].
 *
 * Reads structured fields (loc, nodeType, logs) from entries.
 * Assigns sequential step numbers in a final pass.
 * Tracks depth via '>>>' / '<<<' markers.
 */

import type { SourceLocation } from '@study-lenses/tracing';

import type { AranOperation, AranStep, RawEntry } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_LOC: SourceLocation = Object.freeze({
	start: Object.freeze({ line: 0, column: 0 }),
	end: Object.freeze({ line: 0, column: 0 }),
});

// ---------------------------------------------------------------------------
// Description parsers (logs[0] string patterns)
// ---------------------------------------------------------------------------

// 'x (read):' | 'x (declare, let)' | 'x (assign):' | 'x (initialize):'
const VARIABLE_RE =
	/^(\S+)\s+\((read|declare|assign|initialize)(?:,\s*(.+?))?\):?$/;

// 'operation (_ + _):' | 'operation (! _):'
const OPERATION_RE = /^operation\s+\((.+)\):$/;

// 'operator (truthy && _):' | 'operator (falsy ?_a_:_b_):'
const OPERATOR_RE = /^operator\s+\((truthy|falsy)\s+(.+)\):$/;

// 'check (if, truthy):' | 'check (for-of):'
const CHECK_RE = /^check\s+\(([^,)]+)(?:,\s*(truthy|falsy))?\):$/;

// 'add (call):' | 'push (call, built-in):'
const CALL_RE = /^(\S+)\s+\(call(?:,\s*(.+?))?\):$/;

// 'hoist: var x' | 'hoist: function foo'
const HOIST_RE = /^hoist:\s+(var|function)\s+(\S+)$/;

// ---------------------------------------------------------------------------
// Prefix parsers (catch/throw/break/continue embedded in prefix)
// ---------------------------------------------------------------------------

// why: break/continue prefixes contain the label after the keyword
// e.g. '5. line 8:4  - break myLoop' → label is 'myLoop'
function extractLabel(prefix: string, keyword: string): string | null {
	const idx = prefix.indexOf(keyword);
	if (idx === -1) return null;
	const after = prefix.slice(idx + keyword.length).trim();
	return after || null;
}

const PREFIX_CATCH_RE = /catch:$/;
const PREFIX_THROW_RE = /throw:$/;
const PREFIX_BREAK_RE = /\bbreak\b/;
const PREFIX_CONTINUE_RE = /\bcontinue\b/;

// ---------------------------------------------------------------------------
// Source line echo detection
// ---------------------------------------------------------------------------

function isSourceLineEcho(entry: RawEntry): boolean {
	return (
		entry.prefix === '' &&
		entry.logs.length === 1 &&
		typeof entry.logs[0] === 'string' &&
		!String(entry.logs[0]).startsWith('hoist:')
	);
}

// ---------------------------------------------------------------------------
// Entry → partial step
// ---------------------------------------------------------------------------

type PartialStep = {
	operation: AranOperation;
	name: string | null;
	operator: string | null;
	modifier: string | null;
	values: unknown[];
};

function parseDescription(
	desc: string,
	logs: readonly unknown[],
): PartialStep | null {
	let match: RegExpMatchArray | null;

	// Variable operations: read, declare, assign, initialize
	match = desc.match(VARIABLE_RE);
	if (match) {
		const [, varName, op, mod] = match;
		const operation = op as AranOperation;
		const hasColon = desc.endsWith(':');
		const values = hasColon ? (logs.slice(1) as unknown[]) : [];
		return {
			operation,
			name: varName,
			operator: null,
			modifier: mod ?? null,
			values,
		};
	}

	// Binary/unary operations: 'operation (_ + _):' or 'operation (! _):'
	match = desc.match(OPERATION_RE);
	if (match) {
		const template = match[1];
		// Unary: '! _' or '_ ++' etc.
		// Binary: '_ + _', '_ === _', etc.
		const isUnary = !template.startsWith('_') || !template.endsWith('_');
		if (isUnary) {
			// Extract operator: everything before ' _' or after '_ '
			const op = template.replace(/\s*_\s*/g, '').trim();
			// Values: everything after the description in logs, minus operators
			const values = logs.slice(1).filter((v) => v !== op) as unknown[];
			return {
				operation: 'unary',
				name: null,
				operator: op,
				modifier: null,
				values,
			};
		}
		// Binary: extract operator from between the two _
		const binMatch = template.match(/^_\s+(.+?)\s+_$/);
		const op = binMatch ? binMatch[1] : template;
		// Values: non-operator items from logs after description
		const values = logs.slice(1).filter((v) => v !== op) as unknown[];
		return {
			operation: 'binary',
			name: null,
			operator: op,
			modifier: null,
			values,
		};
	}

	// Logical/conditional operators: 'operator (truthy && _):' or 'operator (falsy ?_a_:_b_):'
	match = desc.match(OPERATOR_RE);
	if (match) {
		const [, truthiness, rest] = match;
		// Conditional: contains '?'
		if (rest.includes('?')) {
			return {
				operation: 'conditional',
				name: null,
				operator: '?:',
				modifier: truthiness,
				values: logs.slice(1).filter((v) => v !== '?_:_') as unknown[],
			};
		}
		// Logical: extract operator (&&, ||, ??)
		const opMatch = rest.match(/^(\S+)\s+_$/);
		const op = opMatch ? opMatch[1] : rest;
		return {
			operation: 'logical',
			name: null,
			operator: op,
			modifier: truthiness,
			values: logs.slice(1).filter((v) => v !== op && v !== '_') as unknown[],
		};
	}

	// Check: 'check (if, truthy):' or 'check (for-of):'
	match = desc.match(CHECK_RE);
	if (match) {
		const [, controlName, truthiness] = match;
		return {
			operation: 'check',
			name: controlName,
			operator: null,
			modifier: truthiness ?? null,
			values: logs.slice(1) as unknown[],
		};
	}

	// Function call: 'add (call):' or 'push (call, built-in):'
	match = desc.match(CALL_RE);
	if (match) {
		const [, funcName, mod] = match;
		// Values: args after description, filtering out comma separators
		const values = logs.slice(1).filter((v) => v !== ',') as unknown[];
		return {
			operation: 'call',
			name: funcName,
			operator: null,
			modifier: mod ?? null,
			values,
		};
	}

	// Hoist: 'hoist: var x' | 'hoist: function foo'
	match = desc.match(HOIST_RE);
	if (match) {
		const [, kind, hoistName] = match;
		return {
			operation: 'hoist',
			name: hoistName,
			operator: null,
			modifier: kind,
			values: [],
		};
	}

	return null;
}

function parseEntry(
	entry: RawEntry,
	prefix: string | null,
): PartialStep | null {
	const logs = entry.logs;

	// --- Prefix-embedded operations ---

	if (typeof prefix === 'string') {
		if (PREFIX_CATCH_RE.test(prefix)) {
			return {
				operation: 'catch',
				name: null,
				operator: null,
				modifier: null,
				values: logs as unknown[],
			};
		}
		if (PREFIX_THROW_RE.test(prefix)) {
			return {
				operation: 'throw',
				name: null,
				operator: null,
				modifier: null,
				values: logs as unknown[],
			};
		}
		if (PREFIX_BREAK_RE.test(prefix)) {
			return {
				operation: 'break',
				name: extractLabel(prefix, 'break'),
				operator: null,
				modifier: null,
				values: [],
			};
		}
		if (PREFIX_CONTINUE_RE.test(prefix)) {
			return {
				operation: 'continue',
				name: extractLabel(prefix, 'continue'),
				operator: null,
				modifier: null,
				values: [],
			};
		}

		// Return value: prefix === '(returns):'
		if (prefix === '(returns):') {
			return {
				operation: 'return',
				name: null,
				operator: null,
				modifier: null,
				values: logs as unknown[],
			};
		}

		// Exception: execution phase header
		if (prefix === '-> execution phase:') {
			return {
				operation: 'exception',
				name: null,
				operator: null,
				modifier: null,
				values: [],
			};
		}

		// Exception: error name prefix with red style
		if (entry.style === 'color:red;') {
			return {
				operation: 'exception',
				name: null,
				operator: null,
				modifier: null,
				values: [prefix, ...(logs as unknown[])],
			};
		}
	}

	// --- logs[0] description-based parsing ---

	if (logs.length === 0) {
		return null;
	}

	const desc = logs[0];
	if (typeof desc !== 'string') {
		return null;
	}

	// Evaluates-to
	if (desc === '(evaluates to):') {
		return {
			operation: 'evaluate',
			name: null,
			operator: null,
			modifier: null,
			values: logs.slice(1) as unknown[],
		};
	}

	// This-binding
	if (desc === 'this:') {
		return {
			operation: 'this',
			name: null,
			operator: null,
			modifier: null,
			values: logs.slice(1) as unknown[],
		};
	}

	// Enter/leave
	if (desc === 'enter ') {
		return {
			operation: 'enter',
			name: null,
			operator: null,
			modifier: null,
			values: logs.slice(1) as unknown[],
		};
	}
	if (desc === 'leave ') {
		return {
			operation: 'leave',
			name: null,
			operator: null,
			modifier: null,
			values: logs.slice(1) as unknown[],
		};
	}

	// Description-based (variables, operators, calls, checks, hoists)
	return parseDescription(desc, logs);
}

// ---------------------------------------------------------------------------
// Scope type inference from groupStart operation
// ---------------------------------------------------------------------------

function inferScopeType(operation: AranOperation): string | null {
	if (operation === 'call') return 'call';
	if (operation === 'check') return 'control';
	if (
		operation === 'binary' ||
		operation === 'unary' ||
		operation === 'logical' ||
		operation === 'conditional'
	) {
		return 'operation';
	}
	return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Transforms raw trace entries into structured AranStep objects.
 *
 * Parses prefix strings from the legacy Aran tracer into typed fields
 * (operation, name, operator, modifier), tracks call depth via `>>>`/`<<<`
 * markers, infers scope types, and shallow-copies loc to serializable POJOs.
 *
 * @param entries - Raw entries from the legacy Aran traceCollector
 * @returns Structured steps (unnumbered — filterSteps assigns step numbers)
 */
function postProcess(entries: readonly (RawEntry | string)[]): AranStep[] {
	const steps: AranStep[] = [];
	let depth = 0;
	const scopeStack: (string | null)[] = [];
	let lastGroupOperation: AranOperation | null = null;

	for (let i = 0; i < entries.length; i++) {
		const item = entries[i];

		// String markers: depth tracking only
		if (typeof item === 'string') {
			if (item === '>>>') {
				depth++;
				scopeStack.push(inferScopeType(lastGroupOperation!));
			} else if (item === '<<<') {
				depth--;
				scopeStack.pop();
			}
			continue;
		}

		// Skip source line echoes
		if (isSourceLineEcho(item)) {
			continue;
		}

		const parsed = parseEntry(item, item.prefix);
		if (parsed === null) {
			continue;
		}

		// why: shallow-copy loc to plain object — Aran AST nodes may carry
		// prototype chains or non-enumerable properties from the parser.
		// Steps must be 100% JSON.stringify-safe POJOs.
		const loc = item.loc
			? {
					start: { line: item.loc.start.line, column: item.loc.start.column },
					end: { line: item.loc.end.line, column: item.loc.end.column },
				}
			: DEFAULT_LOC;

		// Track last group operation for scope type inference
		if (item.type === 'groupStart') {
			lastGroupOperation = parsed.operation;
		}

		const scopeType =
			scopeStack.length > 0 ? scopeStack[scopeStack.length - 1] : null;

		steps.push({
			step: 0, // assigned in final pass
			loc,
			operation: parsed.operation,
			name: parsed.name,
			operator: parsed.operator,
			modifier: parsed.modifier,
			values: parsed.values,
			depth,
			scopeType,
			nodeType: item.nodeType ?? null,
		});
	}

	// Merge pass: fold evaluate results into parent operator steps.
	// When an operator (binary/unary/conditional) at depth N is immediately
	// followed by an evaluate step at depth N+1, copy the result onto the
	// parent and remove the evaluate step.
	const OPERATOR_OPS = new Set(['binary', 'unary', 'conditional']);
	const merged: AranStep[] = [];
	for (let i = 0; i < steps.length; i++) {
		const current = steps[i];
		const next = steps[i + 1];

		if (
			OPERATOR_OPS.has(current.operation) &&
			next &&
			next.operation === 'evaluate' &&
			next.depth === current.depth + 1
		) {
			merged.push({ ...current, result: next.values[0] } as AranStep);
			i++; // skip the evaluate step
			continue;
		}

		// eslint-disable-next-line functional/immutable-data
		merged.push(current);
	}

	// Final pass: assign sequential 1-indexed step numbers
	for (let i = 0; i < merged.length; i++) {
		(merged[i] as { step: number }).step = i + 1;
	}

	return merged;
}

export default postProcess;
