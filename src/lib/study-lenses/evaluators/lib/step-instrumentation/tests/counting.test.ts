import { describe, expect, it } from 'vitest';

import readCapTrip from '../runtime/read-cap-trip.js';

import traceInNode from './pipeline-harness.js';

describe('counting and caps', () => {
	it.skip('maxSites N admits N observation points', () => {
		const { thrown } = traceInNode('1; 2; 3; 4; 5;', {}, { maxSites: 5 });
		expect(readCapTrip(thrown)).toMatchObject({ kind: 'sites', cap: 5 });
	});

	it.skip('the cap message names N+1', () => {
		const { thrown } = traceInNode('1; 2; 3;', {}, { maxSites: 2 });
		expect(String((thrown as Error).message)).toContain('3');
	});

	it.skip('the site counter initializes at 1 for the anchor family', () => {
		const { thrown } = traceInNode('', {}, { maxSites: 1 });
		expect(readCapTrip(thrown)).toBeNull();
	});

	it.skip('a gated-off point keeps its count touch', () => {
		const capped = traceInNode(
			'1; 2; 3;',
			{ statements: { expressionStatement: false } },
			{ maxSites: 2 },
		);
		expect(readCapTrip(capped.thrown)).toMatchObject({ kind: 'sites' });
	});

	it.skip("maxTime trips as klve's own cap, not the engine budget", () => {
		const { thrown } = traceInNode(
			'let i = 0; while (i < 1e7) { i = i + 1; }',
			{},
			{ maxTime: 1 },
		);
		expect(readCapTrip(thrown)).toMatchObject({ kind: 'time' });
	});

	it.skip("a loop entry's count resets per entry", () => {
		const { thrown } = traceInNode(
			'for (let a = 0; a < 3; a = a + 1) { for (let b = 0; b < 3; b = b + 1) { b; } }',
			{},
			{ maxIterations: 3 },
		);
		expect(readCapTrip(thrown)).toBeNull();
	});

	it.skip('the iterations trip marks kind iterations', () => {
		const { thrown } = traceInNode(
			'let i = 0; while (true) { i = i + 1; }',
			{},
			{ maxIterations: 10 },
		);
		expect(readCapTrip(thrown)).toMatchObject({ kind: 'iterations', cap: 10 });
	});

	it.skip('a twice-run statement counts two visits', () => {
		const { events, visitCounts } = traceInNode(
			'let t = 0; while (t < 2) { t = t + 1; }',
		);
		const assignment = events.find(
			(event) =>
				event.semantics === 'expression' && event.category === 'assignment',
		);
		expect(visitCounts[(assignment as { nodePath: string }).nodePath]).toBe(2);
	});

	it.skip('a learner catch can catch a trip; the marker survives for readCapTrip', () => {
		const { events } = traceInNode(
			'let caught = null; try { let i = 0; while (true) { i = i + 1; } } catch (error) { caught = "yes"; }',
			{},
			{ maxIterations: 5 },
		);
		expect(
			events.some(
				(event) =>
					event.semantics === 'resolve' &&
					event.value.type === 'string' &&
					event.value.value === 'yes',
			),
		).toBe(true);
	});

	it.skip('a forged marker classifies null', () => {
		expect(
			readCapTrip(
				Object.assign(new RangeError('fake'), { forged: { kind: 'sites' } }),
			),
		).toBeNull();
	});
});
