import { describe, expect, it } from 'vitest';

import variablesThreadLogic from '../variables-thread-logic.js';

/** A minimal-but-valid event of `event` with the three base fields. */
function event(name: string, extra: Record<string, unknown> = {}): unknown {
	return {
		event: name,
		step: 1,
		nodePath: '$.body.0',
		scopeInstanceId: 0,
		...extra,
	};
}

describe('variablesThreadLogic', () => {
	describe('onMessage drops a malformed message (returns undefined)', () => {
		it.each([
			['undefined', undefined],
			['null', null],
			['a string', 'read'],
			['a number', 42],
			['an array', [event('read', { name: 'x', value: 1 })]],
			[
				'an object with no event field',
				{ step: 1, nodePath: '$', scopeInstanceId: 0 },
			],
			['an unknown event name', event('declare', { name: 'x' })],
			[
				'a non-string event',
				{ event: 42, step: 1, nodePath: '$', scopeInstanceId: 0 },
			],
			['a missing step', { event: 'read', nodePath: '$', scopeInstanceId: 0 }],
			['a missing nodePath', { event: 'read', step: 1, scopeInstanceId: 0 }],
			['a missing scopeInstanceId', { event: 'read', step: 1, nodePath: '$' }],
			[
				'a non-number step',
				{ event: 'read', step: '1', nodePath: '$', scopeInstanceId: 0 },
			],
			[
				'a non-string nodePath',
				{ event: 'read', step: 1, nodePath: 5, scopeInstanceId: 0 },
			],
			[
				'a null scopeInstanceId',
				{ event: 'read', step: 1, nodePath: '$', scopeInstanceId: null },
			],
		])('drops %s', (_label, message) => {
			expect(variablesThreadLogic.onMessage(message)).toBeUndefined();
		});
	});

	describe('onMessage yields a well-formed event by reference', () => {
		it.each([
			['scope-push', { scopeKind: 'block', variables: [] }],
			['scope-pop', { scopeKind: 'block', reason: 'normal', variables: [] }],
			['initialize', { name: 'x', value: 1, explicit: true }],
			['read', { name: 'x', value: 1 }],
			[
				'assign',
				{ name: 'x', operator: '=', priorValue: 1, nextValue: 2, wrote: true },
			],
			[
				'increment',
				{
					name: 'x',
					operator: '++',
					form: 'prefix',
					priorValue: 1,
					nextValue: 2,
					returnedValue: 2,
				},
			],
		])('yields a %s event', (name, extra) => {
			const message = event(name, extra);

			expect(variablesThreadLogic.onMessage(message)).toBe(message);
		});

		it('yields an event carrying extra properties (the worker is the field authority)', () => {
			const message = event('read', { name: 'x', value: 1, futureField: true });

			expect(variablesThreadLogic.onMessage(message)).toBe(message);
		});

		it('does not freeze the yielded message (the engine freezes at yield)', () => {
			const message = event('read', { name: 'x', value: 1 });

			variablesThreadLogic.onMessage(message);

			expect(Object.isFrozen(message)).toBe(false);
		});
	});

	it('is stateless — a dropped message does not affect the next yield', () => {
		expect(variablesThreadLogic.onMessage(null)).toBeUndefined();

		const message = event('read', { name: 'x', value: 1 });

		expect(variablesThreadLogic.onMessage(message)).toBe(message);
	});
});
