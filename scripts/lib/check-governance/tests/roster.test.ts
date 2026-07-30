import { describe, expect, it } from 'vitest';
import parseDocument from '../parse.mjs';
import checkRoster from '../roster.mjs';

const REAL_TABLE = [
	'### Sub-model dispatch',
	'',
	'Current roster (mirrors the frontmatter; if they ever diverge, the',
	'frontmatter wins):',
	'',
	'| AR                          | What it catches               | Model    |',
	'| --------------------------- | ----------------------------- | -------- |',
	'| AR-1 (Design Challenge)     | Drift / cross-cutting         | `opus`   |',
	'| AR-2 (Architectural Sketch) | Drift / cross-cutting         | inherit  |',
	'| AR-3 (Test Strategy)        | Implementation correctness    | `sonnet` |',
	'| AR-4 (Impl Audit)           | Implementation correctness    | `sonnet` |',
	'| AR-5 (Pre-Merge)            | Drift + cross-cutting + scope | inherit  |',
	'',
	'Reasoning: judgment-heavy reviews (design, sketch, pre-merge) should track',
	'or exceed the authoring tier.',
	'',
	'"inherit" means no `model:` line in that agent\'s frontmatter.',
	'',
].join('\n');

const REAL_AR1_SECTION = [
	'### AR-1: Design Challenge',
	'',
	'**Trigger:** During Phase 0, after README spec (step 0.2), before types.ts locks',
	'the contract (step 0.4). **Skip:** Only when the human explicitly opts out.',
	'',
	'- Are there simpler alternatives that achieve the same goal?',
	'',
	'**Provide to agent:** README updates, any design notes, existing codebase',
	'patterns',
	'',
].join('\n');

const FOLDED_DESCRIPTION = [
	'description:',
	"  Use to run an AR-1 (Design Challenge) review per a project's Adversarial",
	'  Review Protocol. Fires during Phase 0.',
].join('\n');

const TWO_ROW_TABLE = [
	'### Sub-model dispatch',
	'',
	'| AR | What it catches | Model |',
	'| --- | --- | --- |',
	'| AR-1 (Design Challenge) | Drift | `opus` |',
	'| AR-2 (Architectural Sketch) | Drift | inherit |',
	'',
].join('\n');

function devDoc(content: string) {
	return parseDocument({ path: 'DEV.md', content });
}

function agentDoc(stem: string, frontmatter: string) {
	return parseDocument({
		path: `.claude/agents/${stem}.md`,
		content: `---\n${frontmatter}\n---\n\n# ${stem}\n`,
	});
}

const REAL_FIVE_AGENTS = [
	agentDoc(
		'ar-1',
		`name: ar-1\n${FOLDED_DESCRIPTION}\nmodel: opus\ntools: Read, Bash`,
	),
	agentDoc('ar-2', 'name: ar-2\ntools: Read, Bash'),
	agentDoc('ar-3', 'name: ar-3\nmodel: sonnet\ntools: Read, Bash'),
	agentDoc('ar-4', 'name: ar-4\nmodel: sonnet\ntools: Read, Bash'),
	agentDoc('ar-5', 'name: ar-5\ntools: Read, Bash'),
];

const TWO_ROW_DOCS = [
	devDoc(TWO_ROW_TABLE + REAL_AR1_SECTION),
	agentDoc('ar-1', 'name: ar-1\nmodel: opus\ntools: Read, Bash'),
	agentDoc('ar-2', 'name: ar-2\ntools: Read, Bash'),
];

describe('checkRoster', () => {
	it('hard-fails when the dispatch heading is missing', () => {
		const docs = [devDoc('# DEV\nno roster here\n')];
		expect(checkRoster(docs)).toEqual([
			{
				path: 'DEV.md',
				line: null,
				check: 'roster',
				severity: 'error',
				message: expect.stringContaining('ROSTER PARSE FAILURE'),
			},
		]);
	});

	it('hard-fails when the dispatch table has zero rows', () => {
		const docs = [devDoc('### Sub-model dispatch\n\nprose only\n')];
		expect(checkRoster(docs)).toEqual([
			{
				path: 'DEV.md',
				line: null,
				check: 'roster',
				severity: 'error',
				message: expect.stringContaining('ROSTER PARSE FAILURE'),
			},
		]);
	});

	it('accepts a one-row roster with its one agent file', () => {
		const table = [
			'### Sub-model dispatch',
			'',
			'| AR | What it catches | Model |',
			'| --- | --- | --- |',
			'| AR-1 (Design Challenge) | Drift | `opus` |',
			'',
		].join('\n');
		const docs = [
			devDoc(table + REAL_AR1_SECTION),
			agentDoc('ar-1', 'name: ar-1\nmodel: opus\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([]);
	});

	it('accepts the real five-row roster against the real frontmatter shapes', () => {
		const docs = [devDoc(REAL_TABLE + REAL_AR1_SECTION), ...REAL_FIVE_AGENTS];
		expect(checkRoster(docs)).toEqual([]);
	});

	it('reports a model mismatch against DEV.md at the row line', () => {
		const docs = [
			devDoc(TWO_ROW_TABLE + REAL_AR1_SECTION),
			agentDoc('ar-1', 'name: ar-1\nmodel: sonnet\ntools: Read, Bash'),
			agentDoc('ar-2', 'name: ar-2\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([
			{
				path: 'DEV.md',
				line: 5,
				check: 'roster',
				severity: 'error',
				message: expect.stringContaining('ar-1'),
			},
		]);
	});

	it('reports an inherit row whose frontmatter pins a model', () => {
		const docs = [
			devDoc(TWO_ROW_TABLE + REAL_AR1_SECTION),
			agentDoc('ar-1', 'name: ar-1\nmodel: opus\ntools: Read, Bash'),
			agentDoc('ar-2', 'name: ar-2\nmodel: sonnet\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([
			expect.objectContaining({
				path: 'DEV.md',
				line: 6,
				severity: 'error',
				message: expect.stringContaining('ar-2'),
			}),
		]);
	});

	it('reports a pinned row whose frontmatter omits the model', () => {
		const docs = [
			devDoc(TWO_ROW_TABLE + REAL_AR1_SECTION),
			agentDoc('ar-1', 'name: ar-1\ntools: Read, Bash'),
			agentDoc('ar-2', 'name: ar-2\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([
			expect.objectContaining({
				path: 'DEV.md',
				line: 5,
				severity: 'error',
				message: expect.stringContaining('ar-1'),
			}),
		]);
	});

	it('reports a table row with no matching agent file', () => {
		const docs = [
			devDoc(TWO_ROW_TABLE + REAL_AR1_SECTION),
			agentDoc('ar-1', 'name: ar-1\nmodel: opus\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([
			expect.objectContaining({
				path: 'DEV.md',
				line: 6,
				severity: 'error',
				message: expect.stringContaining('ar-2'),
			}),
		]);
	});

	it('reports an agent file with no matching table row', () => {
		const docs = [
			...TWO_ROW_DOCS,
			agentDoc('ar-3', 'name: ar-3\nmodel: sonnet\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([
			expect.objectContaining({
				path: 'DEV.md',
				line: 1,
				severity: 'error',
				message: expect.stringContaining('ar-3'),
			}),
		]);
	});

	it('reports a frontmatter name differing from the file stem at the agent file', () => {
		const docs = [
			devDoc(TWO_ROW_TABLE + REAL_AR1_SECTION),
			agentDoc('ar-1', 'name: ar-one\nmodel: opus\ntools: Read, Bash'),
			agentDoc('ar-2', 'name: ar-2\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([
			expect.objectContaining({
				path: '.claude/agents/ar-1.md',
				line: 2,
				severity: 'error',
				message: expect.stringContaining('ar-one'),
			}),
		]);
	});

	it('reports a table row whose AR cell does not parse, at that row', () => {
		const table = [
			'### Sub-model dispatch',
			'',
			'| AR | What it catches | Model |',
			'| --- | --- | --- |',
			'| AR-1 (Design Challenge) | Drift | `opus` |',
			'| Design Challenge only | Drift | `opus` |',
			'',
		].join('\n');
		const docs = [
			devDoc(table + REAL_AR1_SECTION),
			agentDoc('ar-1', 'name: ar-1\nmodel: opus\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([
			expect.objectContaining({
				path: 'DEV.md',
				line: 6,
				severity: 'error',
				message: expect.stringContaining('Design Challenge only'),
			}),
		]);
	});

	// PINNED(Wave-5 ruling 2026-07-29: a duplicate AR row is an ERROR — the
	// silent last-wins overwrite is the defect class this checker exists for)
	it('reports a duplicate AR row instead of letting it overwrite', () => {
		const table = [
			'### Sub-model dispatch',
			'',
			'| AR | What it catches | Model |',
			'| --- | --- | --- |',
			'| AR-1 (Design Challenge) | Drift | `opus` |',
			'| AR-1 (Design Challenge) | Drift | `sonnet` |',
			'',
		].join('\n');
		const docs = [
			devDoc(table + REAL_AR1_SECTION),
			agentDoc('ar-1', 'name: ar-1\nmodel: opus\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([
			expect.objectContaining({
				path: 'DEV.md',
				line: 6,
				severity: 'error',
				message: expect.stringContaining('duplicate'),
			}),
		]);
	});

	it('reports a reviewer file with malformed frontmatter as a whole-document finding', () => {
		const broken = parseDocument({
			path: '.claude/agents/ar-1.md',
			content: '---\nmodel: opus\ntools: Read, Bash\n---\n\n# ar-1\n',
		});
		const docs = [
			devDoc(TWO_ROW_TABLE + REAL_AR1_SECTION),
			broken,
			agentDoc('ar-2', 'name: ar-2\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toContainEqual(
			expect.objectContaining({
				path: '.claude/agents/ar-1.md',
				line: null,
				severity: 'error',
			}),
		);
	});

	it('ignores non-reviewer agent files as a named skip', () => {
		const docs = [
			...TWO_ROW_DOCS,
			agentDoc('harness-probe', 'name: harness-probe\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([]);
	});

	it('reports an AR section that does not open with a Trigger line', () => {
		const section = REAL_AR1_SECTION.replace('**Trigger:** During', 'During');
		const docs = [
			devDoc(TWO_ROW_TABLE + section),
			agentDoc('ar-1', 'name: ar-1\nmodel: opus\ntools: Read, Bash'),
			agentDoc('ar-2', 'name: ar-2\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([
			expect.objectContaining({
				path: 'DEV.md',
				line: expect.any(Number),
				severity: 'error',
				message: expect.stringContaining('AR-1'),
			}),
		]);
	});

	it('reports an AR section missing its Provide line', () => {
		const section = REAL_AR1_SECTION.replace(
			'**Provide to agent:** README updates, any design notes, existing codebase',
			'no provide marker here, and',
		);
		const docs = [
			devDoc(TWO_ROW_TABLE + section),
			agentDoc('ar-1', 'name: ar-1\nmodel: opus\ntools: Read, Bash'),
			agentDoc('ar-2', 'name: ar-2\ntools: Read, Bash'),
		];
		expect(checkRoster(docs)).toEqual([
			expect.objectContaining({
				path: 'DEV.md',
				line: expect.any(Number),
				severity: 'error',
				message: expect.stringContaining('AR-1'),
			}),
		]);
	});
});
