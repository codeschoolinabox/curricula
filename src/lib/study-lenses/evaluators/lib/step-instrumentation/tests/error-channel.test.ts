import { describe, expect, it } from 'vitest';

import traceInNode from './pipeline-harness.js';

describe('the error channel (v1: uncaught only)', () => {
	it.skip('an uncaught throw emits the error event and rethrows', () => {
		const { events, thrown } = traceInNode('missing;');
		expect({
			emitted: events.some((event) => event.semantics === 'error'),
			rethrown: thrown instanceof ReferenceError,
		}).toEqual({ emitted: true, rethrown: true });
	});

	it.skip('a caught throw emits no error event', () => {
		const { events } = traceInNode('try { missing; } catch (error) { 1; }');
		expect(events.some((event) => event.semantics === 'error')).toBe(false);
	});

	it.skip('the error event labels its approximate attribution', () => {
		const { events } = traceInNode('let a = 1; missing;');
		const errorEvent = events.find((event) => event.semantics === 'error');
		expect(errorEvent).toMatchObject({ attribution: 'last-emitted' });
	});

	it.skip('errors false suppresses the event, never the throw', () => {
		const { events, thrown } = traceInNode('missing;', { errors: false });
		expect({
			emitted: events.some((event) => event.semantics === 'error'),
			rethrown: thrown instanceof ReferenceError,
		}).toEqual({ emitted: false, rethrown: true });
	});
});
