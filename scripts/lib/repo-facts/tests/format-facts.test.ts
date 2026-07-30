import { describe, expect, it } from 'vitest';
import formatFacts from '../format-facts.mjs';

const HEADER_AT = (ts: string) =>
	`MEASURED AT ${ts}, not asserted — supersedes any memory or handoff claim about these numbers.`;

function measurement(overrides = {}) {
	return {
		label: 'tsc errors',
		command: 'npx tsc --noEmit',
		value: '0',
		timestamp: '2026-07-29T18:00:00Z',
		...overrides,
	};
}

describe('formatFacts', () => {
	it('emits the header alone for zero measurements', () => {
		const text = formatFacts([], '2026-07-29T18:00:05Z');
		expect(text.trim()).toBe(HEADER_AT('2026-07-29T18:00:05Z'));
	});

	it('opens with the exact measured-at header on its own line', () => {
		const text = formatFacts([measurement()], '2026-07-29T18:00:05Z');
		expect(text.split('\n')[0]).toBe(HEADER_AT('2026-07-29T18:00:05Z'));
	});

	it('threads a different generation time into the header', () => {
		const text = formatFacts([measurement()], '2026-08-02T09:30:00Z');
		expect(text.split('\n')[0]).toBe(HEADER_AT('2026-08-02T09:30:00Z'));
	});

	it('carries the label and value of a measurement', () => {
		const text = formatFacts([measurement()], '2026-07-29T18:00:05Z');
		expect(text).toContain('tsc errors: 0');
	});

	it('carries the producing command verbatim', () => {
		const text = formatFacts([measurement()], '2026-07-29T18:00:05Z');
		expect(text).toContain('npx tsc --noEmit');
	});

	it("carries each measurement's own timestamp", () => {
		const text = formatFacts(
			[measurement({ timestamp: '2026-08-02T09:29:41Z' })],
			'2026-08-02T09:30:00Z',
		);
		expect(text).toContain('2026-08-02T09:29:41Z');
	});

	it('carries each measurement of several', () => {
		const text = formatFacts(
			[
				measurement(),
				measurement({
					label: 'HEAD',
					command: 'git rev-parse HEAD',
					value: 'abc123',
				}),
			],
			'2026-07-29T18:00:05Z',
		);
		expect(text).toContain('HEAD: abc123');
	});

	it('renders a multi-line value as indented lines under its label', () => {
		const text = formatFacts(
			[measurement({ label: 'foreign dirt', value: 'a.txt\nb.txt' })],
			'2026-07-29T18:00:05Z',
		);
		expect(text).toContain('foreign dirt:\n  a.txt\n  b.txt');
	});
});
