import { describe, expect, it } from 'vitest';

import type { WorkerApi } from '../../../../../../study-lenses--deprecated-architecture/lib/engine/types.js';
import buildScope from '../../../../scope/build-scope.js';
import justEnoughJs from '../../../../validating/just-enough-js.js';
import validateProgram from '../../../../validating/validate-program.js';
import instrumentVariables from '../instrument-variables.js';
import projectScopeTable from '../project-scope-table.js';
import type { VariablesHalt, VariablesTraceEvent } from '../types.js';
import variablesWorkerSetup from '../variables-worker-setup.js';

type RunResult = {
	readonly events: readonly VariablesTraceEvent[];
	readonly halt: VariablesHalt;
	readonly code: string;
};

/**
 * Runs the REAL pipeline — validate (gate) → project (I1) → instrument (I2) →
 * worker logic (I3) — against a recording `api`. The instrumented source runs
 * via `new Function` with the worker's globals injected as the engine bootstrap
 * does, including the bootstrap's `"use strict"` prefix (`worker/bootstrap.ts`),
 * so this exercises the worker against genuine I2 output under production-faithful
 * semantics. The recording `emit` structured-clones each message — so a
 * non-clone-safe value leaked onto an event (a raw function instead of an
 * OpaqueValue) throws here — and the halt is cloned for the same guarantee.
 */
function runWorker(source: string): RunResult {
	const { ast } = validateProgram(source, justEnoughJs);
	if (!ast) {
		throw new Error('fixture failed to parse');
	}
	const scopeTable = projectScopeTable(ast, buildScope(ast));
	const code = instrumentVariables(ast, source, scopeTable);

	const events: VariablesTraceEvent[] = [];
	const api: WorkerApi = {
		emit: (message) => {
			events.push(structuredClone(message) as VariablesTraceEvent);
		},
		call: () => null,
	};
	const { globals, serializeHalt } = variablesWorkerSetup(api, scopeTable);
	if (!serializeHalt) {
		throw new Error('worker setup must provide serializeHalt');
	}
	const names = Object.keys(globals);
	const values = Object.values(globals);
	const body = `"use strict";\n${code}`;

	let halt: VariablesHalt;
	try {
		// eslint-disable-next-line @typescript-eslint/no-implied-eval, sonarjs/code-eval -- running real instrumented output against the worker IS the integration oracle
		new Function(...names, body)(...values);
		// eslint-disable-next-line unicorn/no-useless-undefined -- the contract pins rawError as undefined on a natural end
		const naturalHalt = serializeHalt('natural-end', undefined);
		halt = structuredClone(naturalHalt) as VariablesHalt;
	} catch (error) {
		halt = structuredClone(serializeHalt('throw', error)) as VariablesHalt;
	}
	return { events, halt, code };
}

const typesOf = (events: readonly VariablesTraceEvent[]): readonly string[] =>
	events.map((event) => event.event);

const byType = (
	events: readonly VariablesTraceEvent[],
	type: VariablesTraceEvent['event'],
): readonly VariablesTraceEvent[] =>
	events.filter((event) => event.event === type);

/** Steps are the consecutive emission order 1, 2, …, N (monotonic, gap-free). */
function assertMonotonicSteps(events: readonly VariablesTraceEvent[]): void {
	const steps = events.map((event) => event.step);
	expect(steps).toStrictEqual(events.map((_event, index) => index + 1));
}

const distinctInstanceIdCount = (
	events: readonly VariablesTraceEvent[],
): number => new Set(events.map((event) => event.scopeInstanceId)).size;

describe('variablesWorkerSetup', () => {
	describe('an empty program', () => {
		it('frames the script scope with a normal push and pop', () => {
			const { events, halt } = runWorker('');

			expect(typesOf(events)).toStrictEqual(['scope-push', 'scope-pop']);
			expect(events[0]).toMatchObject({
				event: 'scope-push',
				scopeKind: 'script',
				nodePath: '$',
				variables: [],
			});
			expect(events[1]).toMatchObject({
				event: 'scope-pop',
				scopeKind: 'script',
				nodePath: '$',
				reason: 'normal',
				variables: [],
			});
			expect(events[0]?.scopeInstanceId).toBe(events[1]?.scopeInstanceId);
			expect(typeof events[0]?.scopeInstanceId).toBe('number');
			assertMonotonicSteps(events);
			expect(halt).toStrictEqual({
				natural: true,
				errorName: '',
				message: '',
				nodePath: null,
			});
		});
	});

	describe('a single variable through its lifecycle', () => {
		it('emits initialize, read, assign, then a pop carrying the assigned value', () => {
			const { events } = runWorker('let x = 1; x; x = 2;');

			expect(typesOf(events)).toStrictEqual([
				'scope-push',
				'initialize',
				'read',
				'assign',
				'scope-pop',
			]);
			expect(events[0]).toMatchObject({
				event: 'scope-push',
				scopeKind: 'script',
				variables: [{ name: 'x', kind: 'let' }],
			});
			expect(events[1]).toMatchObject({
				event: 'initialize',
				name: 'x',
				value: 1,
				explicit: true,
			});
			expect(events[2]).toMatchObject({ event: 'read', name: 'x', value: 1 });
			expect(events[3]).toMatchObject({
				event: 'assign',
				name: 'x',
				operator: '=',
				priorValue: 1,
				nextValue: 2,
				wrote: true,
			});
			expect(events[4]).toMatchObject({
				event: 'scope-pop',
				reason: 'normal',
				variables: [
					{ name: 'x', kind: 'let', status: 'initialized', value: 2 },
				],
			});
			expect(distinctInstanceIdCount(events)).toBe(1);
			assertMonotonicSteps(events);
		});
	});

	describe('an implicit declaration', () => {
		it('initializes to undefined with explicit:false and pops it initialized', () => {
			const { events } = runWorker('let x;');

			expect(typesOf(events)).toStrictEqual([
				'scope-push',
				'initialize',
				'scope-pop',
			]);
			expect(events[1]).toMatchObject({
				event: 'initialize',
				name: 'x',
				value: undefined,
				explicit: false,
			});
			expect(events[2]).toMatchObject({
				event: 'scope-pop',
				variables: [
					{ name: 'x', kind: 'let', status: 'initialized', value: undefined },
				],
			});
		});
	});

	describe('many declarators', () => {
		it('emits one initialize per declarator in source order', () => {
			const { events } = runWorker('let a = 1, b = 2;');

			expect(typesOf(events)).toStrictEqual([
				'scope-push',
				'initialize',
				'initialize',
				'scope-pop',
			]);
			expect(events[0]).toMatchObject({
				variables: [
					{ name: 'a', kind: 'let' },
					{ name: 'b', kind: 'let' },
				],
			});
			expect(events[1]).toMatchObject({ name: 'a', value: 1 });
			expect(events[2]).toMatchObject({ name: 'b', value: 2 });
		});
	});

	describe('a binding read from an inner scope (HOME vs current instance)', () => {
		it('attributes the read to the binding declaring (outer) scope instance', () => {
			const { events } = runWorker('let x = 1; { let y = 2; x; }');

			const scriptPush = events[0];
			const innerPush = events.find(
				(event, index) => event.event === 'scope-push' && index > 0,
			);
			const readX = events.find((event) => event.event === 'read');

			expect(scriptPush).toMatchObject({
				event: 'scope-push',
				scopeKind: 'script',
			});
			expect(innerPush).toMatchObject({
				event: 'scope-push',
				scopeKind: 'block',
			});
			expect(readX).toMatchObject({ event: 'read', name: 'x', value: 1 });
			// HOME: the read carries the SCRIPT instance (x's declaring scope),
			// not the inner block instance it textually executes in.
			expect(readX?.scopeInstanceId).toBe(scriptPush?.scopeInstanceId);
			expect(readX?.scopeInstanceId).not.toBe(innerPush?.scopeInstanceId);
		});

		it('updates the outer binding in its home frame when assigned from an inner scope', () => {
			const { events } = runWorker('let x = 1; { let y = 0; x = 2; }');

			const scriptPush = events[0];
			const assignX = events.find((event) => event.event === 'assign');
			expect(assignX).toMatchObject({
				event: 'assign',
				name: 'x',
				priorValue: 1,
				nextValue: 2,
				wrote: true,
			});
			// the assign is attributed to x's home (script) instance, and the
			// final value lands on the SCRIPT frame's x, not the inner block.
			expect(assignX?.scopeInstanceId).toBe(scriptPush?.scopeInstanceId);
			const scriptPop = events.find(
				(event) => event.event === 'scope-pop' && event.scopeKind === 'script',
			);
			expect(scriptPop).toMatchObject({
				variables: [{ name: 'x', value: 2 }],
			});
		});
	});

	describe('assignment forms', () => {
		it('compound += reads prior then writes the coerced result', () => {
			const { events } = runWorker('let x = 1; x += 2;');
			expect(byType(events, 'assign')[0]).toMatchObject({
				operator: '+=',
				priorValue: 1,
				nextValue: 3,
				wrote: true,
			});
			expect(byType(events, 'scope-pop')[0]).toMatchObject({
				variables: [{ name: 'x', value: 3 }],
			});
			assertMonotonicSteps(events);
		});

		it('??= writes when the prior is nullish', () => {
			const { events } = runWorker('let x = null; x ??= 5;');
			expect(byType(events, 'assign')[0]).toMatchObject({
				operator: '??=',
				priorValue: null,
				nextValue: 5,
				wrote: true,
			});
			expect(byType(events, 'scope-pop')[0]).toMatchObject({
				variables: [{ name: 'x', value: 5 }],
			});
		});

		it('||= writes when the prior is falsy', () => {
			const { events } = runWorker('let x = 0; x ||= 5;');
			expect(byType(events, 'assign')[0]).toMatchObject({
				operator: '||=',
				priorValue: 0,
				nextValue: 5,
				wrote: true,
			});
		});

		it('||= short-circuits on a truthy prior: wrote:false, no nextValue, registry unchanged', () => {
			const { events } = runWorker('let x = 1; x ||= 5;');
			const assignEvent = byType(events, 'assign')[0];
			expect(assignEvent).toMatchObject({
				operator: '||=',
				priorValue: 1,
				wrote: false,
			});
			expect(assignEvent && 'nextValue' in assignEvent).toBe(false);
			expect(byType(events, 'scope-pop')[0]).toMatchObject({
				variables: [{ name: 'x', value: 1 }],
			});
		});

		it('??= short-circuits on a non-nullish prior', () => {
			const { events } = runWorker('let x = 0; x ??= 5;');
			const assignEvent = byType(events, 'assign')[0];
			expect(assignEvent).toMatchObject({ operator: '??=', wrote: false });
			expect(assignEvent && 'nextValue' in assignEvent).toBe(false);
		});

		it('&&= short-circuits on a falsy prior', () => {
			const { events } = runWorker('let x = 0; x &&= 5;');
			const assignEvent = byType(events, 'assign')[0];
			expect(assignEvent).toMatchObject({ operator: '&&=', wrote: false });
			expect(assignEvent && 'nextValue' in assignEvent).toBe(false);
		});

		it('&&= writes when the prior is truthy', () => {
			const { events } = runWorker('let x = 1; x &&= 5;');
			expect(byType(events, 'assign')[0]).toMatchObject({
				operator: '&&=',
				priorValue: 1,
				nextValue: 5,
				wrote: true,
			});
		});
	});

	describe('increment forms', () => {
		it('postfix ++ returns the old value and stores the new', () => {
			const { events } = runWorker('let x = 1; x++;');
			expect(byType(events, 'increment')[0]).toMatchObject({
				operator: '++',
				form: 'postfix',
				priorValue: 1,
				nextValue: 2,
				returnedValue: 1,
			});
			expect(byType(events, 'scope-pop')[0]).toMatchObject({
				variables: [{ name: 'x', value: 2 }],
			});
			assertMonotonicSteps(events);
		});

		it('steps a bigint by re-reading the stored value, not reconstructing it', () => {
			const { events } = runWorker('let x = 1n; x++;');
			expect(byType(events, 'increment')[0]).toMatchObject({
				operator: '++',
				form: 'postfix',
				priorValue: 1n,
				nextValue: 2n,
				returnedValue: 1n,
			});
			expect(byType(events, 'scope-pop')[0]).toMatchObject({
				variables: [{ name: 'x', value: 2n }],
			});
		});

		it('prefix ++ returns the new value', () => {
			const { events } = runWorker('let x = 1; ++x;');
			expect(byType(events, 'increment')[0]).toMatchObject({
				operator: '++',
				form: 'prefix',
				priorValue: 1,
				nextValue: 2,
				returnedValue: 2,
			});
		});

		it('postfix -- steps down, returning the old value', () => {
			const { events } = runWorker('let x = 1; x--;');
			expect(byType(events, 'increment')[0]).toMatchObject({
				operator: '--',
				form: 'postfix',
				priorValue: 1,
				nextValue: 0,
				returnedValue: 1,
			});
		});
	});

	describe('loop scope instances', () => {
		it('for-of opens a fresh scope instance per iteration', () => {
			const { events } = runWorker('for (const c of [1, 2]) {}');

			const forOfPushes = events.filter(
				(event) => event.event === 'scope-push' && event.scopeKind === 'for-of',
			);
			expect(forOfPushes).toHaveLength(2);
			expect(
				new Set(forOfPushes.map((event) => event.scopeInstanceId)).size,
			).toBe(2);

			const inits = byType(events, 'initialize');
			expect(inits.map((event) => (event as { value: unknown }).value)).toEqual(
				[1, 2],
			);
			assertMonotonicSteps(events);
		});

		it('classic for uses one synthesized for-scope across all iterations', () => {
			const { events } = runWorker('for (let i = 0; i < 2; i++) {}');

			const forPushes = events.filter(
				(event) => event.event === 'scope-push' && event.scopeKind === 'for',
			);
			expect(forPushes).toHaveLength(1);
			expect(byType(events, 'increment')).toHaveLength(2);
			const forPop = events.find(
				(event) => event.event === 'scope-pop' && event.scopeKind === 'for',
			);
			expect(forPop).toMatchObject({
				reason: 'normal',
				variables: [{ name: 'i', value: 2 }],
			});
		});
	});

	describe('shadowing across scopes (registry per-frame isolation)', () => {
		it('keeps a body-block binding distinct from the for-head binding it shadows', () => {
			const { events } = runWorker(
				'for (let i = 0; i < 1; i++) { let i = 99; }',
			);

			const forPop = events.find(
				(event) => event.event === 'scope-pop' && event.scopeKind === 'for',
			);
			const blockPop = events.find(
				(event) => event.event === 'scope-pop' && event.scopeKind === 'block',
			);
			expect(forPop).toMatchObject({ variables: [{ name: 'i', value: 1 }] });
			expect(blockPop).toMatchObject({ variables: [{ name: 'i', value: 99 }] });
		});
	});

	describe('the abrupt-completion flag protocol', () => {
		it('a break unwinds every scope it passes through, all popping break', () => {
			const { events } = runWorker(
				'for (const c of [1]) { { let z = 1; break; } }',
			);

			const popReasons = byType(events, 'scope-pop').map((event) => ({
				reason: (event as { reason: string }).reason,
				scopeKind: (event as { scopeKind: string }).scopeKind,
			}));
			// inner block and the for-of body both pop 'break'; the script pops 'normal'.
			expect(popReasons).toContainEqual({
				reason: 'break',
				scopeKind: 'block',
			});
			expect(popReasons).toContainEqual({
				reason: 'break',
				scopeKind: 'for-of',
			});
			expect(popReasons).toContainEqual({
				reason: 'normal',
				scopeKind: 'script',
			});
		});

		it('a continuing for-of body pops continue each iteration', () => {
			const { events } = runWorker(
				'for (const c of [1, 2]) { { let z = 1; continue; } }',
			);
			const forOfPops = events.filter(
				(event) => event.event === 'scope-pop' && event.scopeKind === 'for-of',
			);
			expect(forOfPops).toHaveLength(2);
			for (const pop of forOfPops) {
				expect(pop).toMatchObject({ reason: 'continue' });
			}
		});

		it('a classic-for whose body continues to completion pops the for-scope normal', () => {
			const { events } = runWorker('for (let i = 0; i < 2; i++) { continue; }');
			const forPop = events.find(
				(event) => event.event === 'scope-pop' && event.scopeKind === 'for',
			);
			expect(forPop).toMatchObject({ reason: 'normal' });
		});

		it('a throw makes every open scope pop error', () => {
			const { events, halt } = runWorker('{ let y = x; let x = 1; }');
			const pops = byType(events, 'scope-pop');
			expect(pops.length).toBeGreaterThanOrEqual(2);
			for (const pop of pops) {
				expect(pop).toMatchObject({ reason: 'error' });
			}
			expect(halt).toMatchObject({
				natural: false,
				errorName: 'ReferenceError',
			});
		});

		it('a stale break flag is cleared by landed before a later sibling scope', () => {
			const { events } = runWorker(
				'for (const c of [1]) { break; } { let z = 1; }',
			);

			const forOfPop = events.find(
				(event) => event.event === 'scope-pop' && event.scopeKind === 'for-of',
			);
			const blockPop = events.find(
				(event) => event.event === 'scope-pop' && event.scopeKind === 'block',
			);
			expect(forOfPop).toMatchObject({ reason: 'break' });
			expect(blockPop).toMatchObject({ reason: 'normal' });
		});
	});

	describe('halt attribution', () => {
		it('a TDZ read is stamped and rethrown with no read or initialize event', () => {
			const { events, halt, code } = runWorker('let y = x; let x = 1;');

			expect(byType(events, 'read')).toHaveLength(0);
			expect(byType(events, 'initialize')).toHaveLength(0);
			expect(halt).toMatchObject({
				natural: false,
				errorName: 'ReferenceError',
			});
			expect(typeof halt.nodePath).toBe('string');
			expect(code).toContain(`__$vr.read("${halt.nodePath}", "x",`);
			assertMonotonicSteps(events);
		});

		it('leaves an undeclared-identifier ReferenceError unattributed (no stamp)', () => {
			// `zzz` is undeclared, so the instrumenter never wraps it; the
			// ReferenceError throws unwrapped, reaching the halt without a node path
			// (the named boundary, contrasting the stamped TDZ read above).
			const { events, halt } = runWorker('let y = zzz;');

			expect(byType(events, 'read')).toHaveLength(0);
			expect(byType(events, 'initialize')).toHaveLength(0);
			expect(halt).toMatchObject({
				natural: false,
				errorName: 'ReferenceError',
				nodePath: null,
			});
		});

		it('a const reassignment is stamped and rethrown with no assign event', () => {
			const { events, halt, code } = runWorker('const c = 1; c = 2;');

			expect(byType(events, 'assign')).toHaveLength(0);
			expect(byType(events, 'initialize')).toHaveLength(1);
			expect(halt).toMatchObject({ natural: false, errorName: 'TypeError' });
			expect(typeof halt.nodePath).toBe('string');
			expect(code).toContain(`__$vr.assign("${halt.nodePath}", "c", "=",`);
		});

		it('a scope-pop reports a still-TDZ binding from the registry without re-reading it', () => {
			const { events } = runWorker('let y = x; let x = 1;');

			const scriptPop = events.find(
				(
					event,
				): event is Extract<VariablesTraceEvent, { event: 'scope-pop' }> =>
					event.event === 'scope-pop' && event.scopeKind === 'script',
			);
			expect(scriptPop).toBeDefined();
			expect(scriptPop).toMatchObject({
				reason: 'error',
				variables: [
					{ name: 'y', status: 'tdz' },
					{ name: 'x', status: 'tdz' },
				],
			});
			for (const variable of scriptPop?.variables ?? []) {
				expect('value' in variable).toBe(false);
			}
		});
	});

	describe('value snapshots', () => {
		it('tags a function value as an opaque snapshot without crashing the clone', () => {
			const run = (): RunResult => runWorker('let f = prompt; f;');
			expect(run).not.toThrow();

			const { events } = run();
			const opaque = { opaqueValue: true, typeOf: 'function' };
			expect(byType(events, 'initialize')[0]).toMatchObject({
				name: 'f',
				value: opaque,
			});
			expect(byType(events, 'read')[0]).toMatchObject({
				name: 'f',
				value: opaque,
			});
			expect(byType(events, 'scope-pop')[0]).toMatchObject({
				variables: [{ name: 'f', status: 'initialized', value: opaque }],
			});
		});
	});
});
