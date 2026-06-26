/**
 * @file Pure-TS tests for the `trace-debugging` derivation core. No React, no
 * jsdom (vitest `node` environment). ZOMBIES coverage of `formatEvent`: one
 * `VariablesTraceEvent` → one verbatim line, across all six variants plus a
 * defensive fallback for an unknown tag.
 *
 * Fixtures are hand-constructed `VariablesTraceEvent` literals — lens purity
 * forbids any runtime import from `embody/` or the tracer tier, so there is no
 * event factory here (contrast `../../debug-props/tests/core.test.ts`, which
 * builds `Snippet`s via `embody('OK')`).
 */

import { describe, expect, it } from 'vitest';

import type {
	VariablesSettlement,
	VariablesTraceEvent,
} from '../../../embody/types.js';
import traceDebuggingCore from '../core.js';

describe('formatEvent', () => {
	// Zero — the degenerate scope-push: a scope with no declared variables.
	it('renders a scope-push with no declared variables as a step-stamped, attributed line', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 0,
			nodePath: '$.body.0',
			scopeInstanceId: 1,
			event: 'scope-push',
			scopeKind: 'block',
			variables: [],
		});
		expect(line).toBe('step 0 $.body.0 SCOPE-PUSH block vars=[]');
	});

	// One+ — a scope-push carrying its declared-variable burst (name:kind list).
	// Forces the variable-list join (a hardcoded `vars=[]` cannot survive).
	it('renders a scope-push with declared variables as a name:kind list', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 1,
			nodePath: '$.body.1',
			scopeInstanceId: 1,
			event: 'scope-push',
			scopeKind: 'block',
			variables: [
				{ name: 'total', kind: 'let' },
				{ name: 'PI', kind: 'const' },
			],
		});
		expect(line).toBe(
			'step 1 $.body.1 SCOPE-PUSH block vars=[total:let, PI:const]',
		);
	});

	// One — the triangulator: a different tag, step, path, and suffix grammar
	// (name → value) that no single hardcoded string from the tests above can pass.
	it('renders a read as name → value with its own step and path', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 4,
			nodePath: '$.body.2.expression',
			scopeInstanceId: 1,
			event: 'read',
			name: 'x',
			value: 5,
		});
		expect(line).toBe('step 4 $.body.2.expression READ x → 5');
	});

	// One — an explicit initialize (`let x = 5`).
	it('renders an explicit initialize as name = value (explicit)', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 2,
			nodePath: '$.body.0.declarations.0',
			scopeInstanceId: 1,
			event: 'initialize',
			name: 'x',
			value: 5,
			explicit: true,
		});
		expect(line).toBe(
			'step 2 $.body.0.declarations.0 INITIALIZE x = 5 (explicit)',
		);
	});

	// Boundary — an implicit initialize (`let y;`): the value genuinely IS
	// `undefined`, so it MUST render `undefined` (contrast the wrote:false assign
	// below, where the next value is ABSENT and must NOT render).
	it('renders an implicit initialize with value undefined as (implicit)', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 3,
			nodePath: '$.body.1.declarations.0',
			scopeInstanceId: 1,
			event: 'initialize',
			name: 'y',
			value: undefined,
			explicit: false,
		});
		expect(line).toBe(
			'step 3 $.body.1.declarations.0 INITIALIZE y = undefined (implicit)',
		);
	});

	// One — a normal scope-pop with one initialized final variable (name:kind=value).
	it('renders a scope-pop with reason and an initialized final variable', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 8,
			nodePath: '$.body.0',
			scopeInstanceId: 1,
			event: 'scope-pop',
			scopeKind: 'block',
			reason: 'normal',
			variables: [{ name: 'x', kind: 'let', status: 'initialized', value: 5 }],
		});
		expect(line).toBe(
			'step 8 $.body.0 SCOPE-POP block reason=normal vars=[x:let=5]',
		);
	});

	// Boundary — an abrupt (break) scope-pop whose final variables mix an
	// initialized binding with a TDZ binding (value ABSENT → `(tdz)`, never a
	// spurious `=undefined`). Also pins a non-`normal` reason.
	it('renders a scope-pop with a tdz final variable and a break reason', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 9,
			nodePath: '$.body.3',
			scopeInstanceId: 2,
			event: 'scope-pop',
			scopeKind: 'for',
			reason: 'break',
			variables: [
				{ name: 'i', kind: 'let', status: 'initialized', value: 3 },
				{ name: 'j', kind: 'const', status: 'tdz' },
			],
		});
		expect(line).toBe(
			'step 9 $.body.3 SCOPE-POP for reason=break vars=[i:let=3, j:const(tdz)]',
		);
	});

	// Boundary — a scope-pop closing a scope that declared nothing: the
	// final-variable join must collapse to `vars=[]` (the pop path has its own
	// map/join, distinct from the scope-push path's).
	it('renders a scope-pop with no final variables as vars=[]', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 10,
			nodePath: '$.body.5',
			scopeInstanceId: 3,
			event: 'scope-pop',
			scopeKind: 'block',
			reason: 'normal',
			variables: [],
		});
		expect(line).toBe('step 10 $.body.5 SCOPE-POP block reason=normal vars=[]');
	});

	// One — an assign that wrote: operator + prior → next transition.
	it('renders a written assign with operator, prior, and next values', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 6,
			nodePath: '$.body.2.expression',
			scopeInstanceId: 1,
			event: 'assign',
			name: 'x',
			operator: '+=',
			priorValue: 2,
			nextValue: 5,
			wrote: true,
		});
		expect(line).toBe('step 6 $.body.2.expression ASSIGN x += : 2 → 5');
	});

	// Boundary — a short-circuited logical assign (`x ||= …`, wrote:false). The
	// `nextValue` KEY IS ABSENT (not `undefined`); the renderer must branch on
	// `wrote` and never read it, so no `→` and no `undefined` leak into the line.
	it('renders a short-circuited assign (wrote:false) as (no write), never reading nextValue', () => {
		const event: VariablesTraceEvent = {
			step: 7,
			nodePath: '$.body.4.expression',
			scopeInstanceId: 1,
			event: 'assign',
			name: 'x',
			operator: '||=',
			priorValue: 5,
			wrote: false,
		};
		const line = traceDebuggingCore.formatEvent(event);
		expect(line).toBe('step 7 $.body.4.expression ASSIGN x ||= (no write)');
	});

	// Boundary (AR-3) — a wrote:false assign that ALSO carries a `nextValue`: the
	// renderer must branch on `wrote`, NOT on `nextValue` presence, so the line is
	// still `(no write)` and the stray `nextValue` never leaks in. A correct-by-
	// accident impl keyed on `nextValue !== undefined` would mis-render this.
	it('renders a wrote:false assign as (no write) even when nextValue is present', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 7,
			nodePath: '$.body.4.expression',
			scopeInstanceId: 1,
			event: 'assign',
			name: 'x',
			operator: '&&=',
			priorValue: 0,
			nextValue: 99,
			wrote: false,
		});
		expect(line).toBe('step 7 $.body.4.expression ASSIGN x &&= (no write)');
	});

	// One — a postfix increment: postfix RETURNS the old value (returned == prior).
	it('renders a postfix increment with prior, next, and returned values', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 5,
			nodePath: '$.body.3.expression',
			scopeInstanceId: 1,
			event: 'increment',
			name: 'x',
			operator: '++',
			form: 'postfix',
			priorValue: 3,
			nextValue: 4,
			returnedValue: 3,
		});
		expect(line).toBe(
			'step 5 $.body.3.expression INCREMENT x ++ postfix : 3 → 4 returns 3',
		);
	});

	// Boundary — a prefix increment: prefix RETURNS the new value (returned ==
	// next). The same prior/next as the postfix case, distinguished only by
	// `form` and `returnedValue`, so all three value slots are independently pinned.
	it('renders a prefix increment whose returned value is the new value', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 5,
			nodePath: '$.body.3.expression',
			scopeInstanceId: 1,
			event: 'increment',
			name: 'x',
			operator: '++',
			form: 'prefix',
			priorValue: 3,
			nextValue: 4,
			returnedValue: 4,
		});
		expect(line).toBe(
			'step 5 $.body.3.expression INCREMENT x ++ prefix : 3 → 4 returns 4',
		);
	});

	// Boundary — an opaque value snapshot (a non-clone-safe value the worker
	// tagged): rendered structurally via its `typeOf`, never crashing.
	it('renders an opaque value snapshot as <opaque typeOf>', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 4,
			nodePath: '$.body.1',
			scopeInstanceId: 1,
			event: 'read',
			name: 'f',
			value: { opaqueValue: true, typeOf: 'function' },
		});
		expect(line).toBe('step 4 $.body.1 READ f → <opaque function>');
	});

	// Boundary — a bigint value: `JSON.stringify` THROWS on bigint, so the
	// renderer must special-case it (rendered with a trailing `n`).
	it('renders a bigint value without throwing', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 4,
			nodePath: '$.body.1',
			scopeInstanceId: 1,
			event: 'read',
			name: 'big',
			value: 10n,
		});
		expect(line).toBe('step 4 $.body.1 READ big → 10n');
	});

	// Boundary (AR-3) — a string ValueSnapshot: rendered JSON-quoted, so a string
	// reads as distinct from a number (`"5"` vs `5`) and from `undefined` in the
	// dump. Pins the string branch of renderValue (otherwise uncontracted).
	it('renders a string value JSON-quoted', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 4,
			nodePath: '$.body.1',
			scopeInstanceId: 1,
			event: 'read',
			name: 's',
			value: 'hello',
		});
		expect(line).toBe('step 4 $.body.1 READ s → "hello"');
	});

	// Boundary — a null value (`let x = null`): a real JEJ value, rendered as the
	// literal `null` (distinct from `undefined` and from the string `"null"`).
	it('renders a null value as null', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 4,
			nodePath: '$.body.1',
			scopeInstanceId: 1,
			event: 'read',
			name: 'x',
			value: null,
		});
		expect(line).toBe('step 4 $.body.1 READ x → null');
	});

	// Exception — a value that cannot be JSON-serialized (a self-referential
	// object): structurally impossible for a real ValueSnapshot, but exactly the
	// input the renderer's fallback try/catch exists to absorb. Must render a
	// placeholder, never throw.
	it('renders an unserializable (circular) value as a placeholder without throwing', () => {
		const circular: { self?: unknown } = {};
		circular.self = circular;
		const line = traceDebuggingCore.formatEvent({
			step: 4,
			nodePath: '$.body.1',
			scopeInstanceId: 1,
			event: 'read',
			name: 'obj',
			value: circular,
		});
		expect(line).toBe('step 4 $.body.1 READ obj → [unserializable]');
	});

	// Exception — a malformed event whose `.event` is none of the six variants:
	// the formatter must NOT throw and must surface the unknown tag (the exact
	// `toBe` also proves it did not mis-route into a real variant branch).
	it('falls back to a defensive line for an unknown event tag (no throw)', () => {
		const line = traceDebuggingCore.formatEvent({
			step: 99,
			nodePath: '$.x',
			scopeInstanceId: 0,
			event: 'mystery',
		} as unknown as VariablesTraceEvent);
		expect(line).toBe('[unknown event] mystery');
	});
});

describe('deriveSettlementModel', () => {
	// One — a clean natural completion: natural halt (errorName ''), no
	// engineError, no failReason. Pins the whole projection in one assertion —
	// outcome round-trips, the headline is the bare outcome (no distinguishing
	// data to append), detail collapses to the no-detail marker (the natural-end
	// halt carries no error-relevant fields), and the raw halt / engineError /
	// failReason / durationMs pass through verbatim.
	it('projects a completed natural settlement into a clean model', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'completed',
			halt: { natural: true, errorName: '', message: '', nodePath: null },
			durationMs: 12,
		});
		expect(model).toEqual({
			outcome: 'completed',
			headline: 'completed',
			detail: ['(no detail)'],
			halt: { natural: true, errorName: '', message: '', nodePath: null },
			engineError: undefined,
			failReason: undefined,
			durationMs: 12,
		});
	});

	// Many / triangulator — an errored throw: the headline names errorName + the
	// nodePath, and detail expands the error-relevant halt fields. A different
	// outcome, a non-trivial detail array, and the `errorName at nodePath` grammar
	// — no hardcode of the completed test survives this.
	it('projects an errored settlement, naming errorName and nodePath in the headline', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'errored',
			halt: {
				natural: false,
				errorName: 'TypeError',
				message: 'x is not a function',
				nodePath: '$.body.1',
			},
			durationMs: 7,
		});
		expect(model).toEqual({
			outcome: 'errored',
			headline: 'errored — TypeError at $.body.1',
			detail: [
				'errorName: TypeError',
				'message: x is not a function',
				'nodePath: $.body.1',
			],
			halt: {
				natural: false,
				errorName: 'TypeError',
				message: 'x is not a function',
				nodePath: '$.body.1',
			},
			engineError: undefined,
			failReason: undefined,
			durationMs: 7,
		});
	});

	// Boundary (A5) — an engine-side errored end with NO worker halt: the headline
	// must fall back to engineError.name and must NOT dereference the null halt (a
	// naive `halt.errorName` read would crash the render path).
	it('projects an errored settlement with a null halt, falling back to the engineError name', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'errored',
			halt: null,
			engineError: {
				cause: 'worker-error',
				name: 'WorkerError',
				message: 'worker crashed',
			},
			durationMs: 9,
		});
		expect(model).toEqual({
			outcome: 'errored',
			headline: 'errored — WorkerError',
			detail: [
				'engine cause: worker-error',
				'engine error: WorkerError',
				'engine message: worker crashed',
			],
			halt: null,
			engineError: {
				cause: 'worker-error',
				name: 'WorkerError',
				message: 'worker crashed',
			},
			failReason: undefined,
			durationMs: 9,
		});
	});

	// Boundary — the doubly-absent errored corner: no worker halt AND no
	// engineError. The null-halt fallback's `?? 'error'` keeps the headline from
	// reading `errored — undefined`, and guards a future refactor that might drop
	// the coalesce (which would then crash on `engineError.name`).
	it('projects an errored settlement with neither halt nor engineError as a generic error', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'errored',
			halt: null,
			durationMs: 1,
		});
		expect(model).toEqual({
			outcome: 'errored',
			headline: 'errored — error',
			detail: ['(no detail)'],
			halt: null,
			engineError: undefined,
			failReason: undefined,
			durationMs: 1,
		});
	});

	// Boundary (engine-documented corner: a thread hook throwing during an errored
	// halt's refinement) — an errored settlement carrying BOTH a halt and an
	// engineError. The headline follows the halt; detail carries BOTH blocks.
	it('projects an errored settlement carrying both a halt and an engineError', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'errored',
			halt: {
				natural: false,
				errorName: 'TypeError',
				message: 'boom',
				nodePath: '$.body.2',
			},
			engineError: {
				cause: 'hook-error',
				name: 'HookError',
				message: 'hook threw',
			},
			durationMs: 20,
		});
		expect(model).toEqual({
			outcome: 'errored',
			headline: 'errored — TypeError at $.body.2',
			detail: [
				'errorName: TypeError',
				'message: boom',
				'nodePath: $.body.2',
				'engine cause: hook-error',
				'engine error: HookError',
				'engine message: hook threw',
			],
			halt: {
				natural: false,
				errorName: 'TypeError',
				message: 'boom',
				nodePath: '$.body.2',
			},
			engineError: {
				cause: 'hook-error',
				name: 'HookError',
				message: 'hook threw',
			},
			failReason: undefined,
			durationMs: 20,
		});
	});

	// Many — a timed-out settlement: the headline names the engineError cause; the
	// empty engine error name drops its detail line.
	it('projects a timed-out settlement, naming the engineError cause', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'timed-out',
			halt: null,
			engineError: { cause: 'timeout', name: '', message: 'budget exhausted' },
			durationMs: 200,
		});
		expect(model).toEqual({
			outcome: 'timed-out',
			headline: 'timed-out — timeout',
			detail: ['engine cause: timeout', 'engine message: budget exhausted'],
			halt: null,
			engineError: { cause: 'timeout', name: '', message: 'budget exhausted' },
			failReason: undefined,
			durationMs: 200,
		});
	});

	// Boundary — a timed-out settlement with no engineError: the headline drops to
	// the bare outcome (no cause to name) and detail collapses to the marker.
	it('projects a timed-out settlement with no engineError as the bare outcome', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'timed-out',
			halt: null,
			durationMs: 200,
		});
		expect(model).toEqual({
			outcome: 'timed-out',
			headline: 'timed-out',
			detail: ['(no detail)'],
			halt: null,
			engineError: undefined,
			failReason: undefined,
			durationMs: 200,
		});
	});

	// Many — a cancelled settlement (a clean consumer stop: no halt, no engineError,
	// no failReason): the bare outcome headline and the no-detail marker.
	it('projects a cancelled settlement as the bare outcome with no detail', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'cancelled',
			halt: null,
			durationMs: 5,
		});
		expect(model).toEqual({
			outcome: 'cancelled',
			headline: 'cancelled',
			detail: ['(no detail)'],
			halt: null,
			engineError: undefined,
			failReason: undefined,
			durationMs: 5,
		});
	});

	// Many — a failed settlement with a string failReason: the headline appends the
	// reason and detail carries it. A string passes through UNQUOTED (the
	// DOCS-prescribed defensive stringifier, distinct from renderValue's JSON form).
	it('projects a failed settlement, passing a string failReason through unquoted', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'failed',
			halt: null,
			failReason: 'boom',
			durationMs: 3,
		});
		expect(model).toEqual({
			outcome: 'failed',
			headline: 'failed — boom',
			detail: ['failReason: boom'],
			halt: null,
			engineError: undefined,
			failReason: 'boom',
			durationMs: 3,
		});
	});

	// Boundary — a failed settlement with NO failReason key (e.g. a foreign
	// `fail()` with no argument): the headline drops to the bare outcome and detail
	// collapses to the marker (gated on `failReason !== undefined`, not key presence).
	it('projects a failed settlement with no failReason as the bare outcome', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'failed',
			halt: null,
			durationMs: 3,
		});
		expect(model).toEqual({
			outcome: 'failed',
			headline: 'failed',
			detail: ['(no detail)'],
			halt: null,
			engineError: undefined,
			failReason: undefined,
			durationMs: 3,
		});
	});

	// Boundary — an errored halt with nodePath null (an unstamped throw, e.g. an
	// undeclared-identifier ReferenceError): the headline drops the ` at` clause
	// and detail drops the nodePath line (never `at null`).
	it('projects an errored settlement with a null nodePath, dropping the location clause', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'errored',
			halt: {
				natural: false,
				errorName: 'ReferenceError',
				message: 'x is not defined',
				nodePath: null,
			},
			durationMs: 4,
		});
		expect(model).toEqual({
			outcome: 'errored',
			headline: 'errored — ReferenceError',
			detail: ['errorName: ReferenceError', 'message: x is not defined'],
			halt: {
				natural: false,
				errorName: 'ReferenceError',
				message: 'x is not defined',
				nodePath: null,
			},
			engineError: undefined,
			failReason: undefined,
			durationMs: 4,
		});
	});

	// Boundary / Exception (DOCS-mandated) — a circular failReason: the defensive
	// stringifier must render a typeof label and NEVER `JSON.stringify` it (which
	// would throw in the render path). Asserts the derived headline + detail (the
	// raw failReason object is retained by reference, covered by the string case).
	it('renders a circular failReason as a typeof label without throwing', () => {
		const circular: { self?: unknown } = {};
		circular.self = circular;
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'failed',
			halt: null,
			failReason: circular,
			durationMs: 6,
		});
		expect(model.headline).toBe('failed — <object>');
		expect(model.detail).toEqual(['failReason: <object>']);
	});

	// Boundary — the model and its nested detail array are both frozen ("Built
	// fresh per settlement, frozen" — types.ts). `toEqual` is blind to freezing,
	// so this is the only guard; the freeze is unconditional, so one case suffices.
	it('returns a frozen model with a frozen detail array', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'completed',
			halt: { natural: true, errorName: '', message: '', nodePath: null },
			durationMs: 1,
		});
		expect(Object.isFrozen(model)).toBe(true);
		expect(Object.isFrozen(model.detail)).toBe(true);
	});

	// Exception — a malformed settlement whose outcome is none of the five: the
	// headline flags it via a widening cast (mirrors formatEvent's fallback) and
	// the function does NOT throw. Fixture carries a valid shape so retained fields
	// round-trip.
	it('falls back to an unknown-outcome headline for an unexpected outcome (no throw)', () => {
		const model = traceDebuggingCore.deriveSettlementModel({
			outcome: 'mystery',
			halt: null,
			durationMs: 0,
		} as unknown as VariablesSettlement);
		expect(model).toEqual({
			outcome: 'mystery',
			headline: 'mystery — unknown outcome',
			detail: ['(no detail)'],
			halt: null,
			engineError: undefined,
			failReason: undefined,
			durationMs: 0,
		});
	});
});
