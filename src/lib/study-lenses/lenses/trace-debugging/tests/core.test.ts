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

import type { VariablesTraceEvent } from '../../../embody/types.js';
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
		expect(line).toBe('step 1 $.body.1 SCOPE-PUSH block vars=[total:let, PI:const]');
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
		expect(line).toBe('step 2 $.body.0.declarations.0 INITIALIZE x = 5 (explicit)');
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
		expect(line).toBe('step 3 $.body.1.declarations.0 INITIALIZE y = undefined (implicit)');
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
		expect(line).toBe('step 8 $.body.0 SCOPE-POP block reason=normal vars=[x:let=5]');
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
		expect(line).toBe('step 9 $.body.3 SCOPE-POP for reason=break vars=[i:let=3, j:const(tdz)]');
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
		expect(line).toBe('step 5 $.body.3.expression INCREMENT x ++ postfix : 3 → 4 returns 3');
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
		expect(line).toBe('step 5 $.body.3.expression INCREMENT x ++ prefix : 3 → 4 returns 4');
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
