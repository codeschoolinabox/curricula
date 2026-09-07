import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import undescribeSteps from '../undescribe-steps.js';

import traceInNode from './pipeline-harness.js';

type FixtureEntry = {
	readonly name: string;
	readonly code: string;
	readonly options: Record<string, unknown>;
	readonly steps?: readonly Record<string, unknown>[];
	readonly error?: { readonly name: string; readonly message: string };
};

function loadFixture(): readonly FixtureEntry[] {
	const fixturePath = path.join(
		path.dirname(fileURLToPath(import.meta.url)),
		'fixtures',
		'klve-differential.json',
	);
	return (
		JSON.parse(readFileSync(fixturePath, 'utf8')) as { entries: FixtureEntry[] }
	).entries;
}

describe('the differential floor (the committed klve fixture is the oracle; deltas named)', () => {
	it.skip('defaults-arithmetic: the value sequence matches the fixture through the mapping', () => {
		const entry = loadFixture().find(
			(candidate) => candidate.name === 'defaults-arithmetic',
		) as FixtureEntry;
		const { events } = traceInNode(entry.code);
		const resolvedNumbers = undescribeSteps(events)
			.filter((event) => event.semantics === 'resolve')
			.map((event) => event.value)
			.filter((value) => value.type === 'number')
			.map((value) => (value as { value: number }).value);
		const fixtureNumbers = (entry.steps ?? [])
			.map((step) => step['value'])
			.filter((value) => typeof value === 'number');
		expect(resolvedNumbers).toEqual(fixtureNumbers);
	});

	it.skip('while-loop: per-iteration test moments match the fixture', () => {
		const entry = loadFixture().find(
			(candidate) => candidate.name === 'while-loop',
		) as FixtureEntry;
		const { events } = traceInNode(entry.code);
		const portTests = events.filter(
			(event) =>
				event.category === 'loop' &&
				(event as { event: string }).event === 'test',
		).length;
		const fixtureTests = (entry.steps ?? []).filter(
			(step) =>
				step['type'] === 'BinaryExpression' && step['time'] === 'before',
		).length;
		expect(portTests).toEqual(fixtureTests);
	});

	it.skip('node-toggle-off: the gated kind is absent on both sides', () => {
		const entry = loadFixture().find(
			(candidate) => candidate.name === 'node-toggle-off',
		) as FixtureEntry;
		const { events } = traceInNode(entry.code, {
			expression: { variables: { read: false } },
		});
		const portReads = events.filter(
			(event) =>
				event.category === 'variable' &&
				(event as { event: string }).event === 'read',
		).length;
		const fixtureReads = (entry.steps ?? []).filter(
			(step) => step['type'] === 'Identifier',
		).length;
		expect(portReads).toEqual(fixtureReads);
	});

	it.skip('names-include: the name filter keeps the same named moments', () => {
		const entry = loadFixture().find(
			(candidate) => candidate.name === 'names-include',
		) as FixtureEntry;
		const { events } = traceInNode(entry.code, {
			expression: { variables: { filter: { include: ['a'] } } },
		});
		const portNamedReads = events.filter(
			(event) =>
				event.category === 'variable' &&
				(event as { event: string }).event === 'read',
		).length;
		const fixtureNamedReads = (entry.steps ?? []).filter(
			(step) =>
				step['type'] === 'Identifier' &&
				(step['detail'] as { name?: string })?.name === 'a',
		).length;
		expect(portNamedReads).toEqual(fixtureNamedReads);
	});

	it.skip('logs on filtered steps re-attach (the ruled delta a)', () => {
		const entry = loadFixture().find(
			(candidate) => candidate.name === 'logs-on-filtered-step',
		) as FixtureEntry;
		const { events } = traceInNode(entry.code, {
			statements: { expressionStatement: false },
		});
		expect(
			events.some((event) =>
				event.semantics === 'resolve' ? Boolean(event.logs?.length) : false,
			),
		).toBe(true);
	});

	it.skip('the cap counts executed sites — instrument-time ≡ post-filter equivalence', () => {
		const entry = loadFixture().find(
			(candidate) => candidate.name === 'cap-trip',
		) as FixtureEntry;
		const { thrown } = traceInNode(entry.code, {}, { maxSites: 25 });
		expect({
			fixtureTripped: entry.error?.name,
			portTripped: thrown instanceof RangeError,
		}).toEqual({ fixtureTripped: 'LimitExceededError', portTripped: true });
	});

	it.skip('a while statement maps before-only', () => {
		const entry = loadFixture().find(
			(candidate) => candidate.name === 'while-loop',
		) as FixtureEntry;
		const fixtureWhileTimes = (entry.steps ?? [])
			.filter((step) => step['type'] === 'WhileStatement')
			.map((step) => step['time']);
		expect(new Set(fixtureWhileTimes)).toEqual(new Set(['before']));
	});

	it.skip('a loop test maps to a before leg each iteration', () => {
		const { events } = traceInNode('let i = 0; while (i < 2) { i = i + 1; }');
		expect(
			events.filter(
				(event) =>
					event.category === 'loop' &&
					(event as { event: string }).event === 'test',
			).length,
		).toBe(3);
	});

	it.skip('the maxTime clock delta is controlled for (t0 at collector creation)', () => {
		const { thrown } = traceInNode('let x = 1;', {}, { maxTime: 60_000 });
		expect(thrown).toBeUndefined();
	});
});
