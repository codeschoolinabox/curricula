import { describe, expect, it } from 'vitest';
import parseDocument from '../parse.mjs';

describe('parseDocument', () => {
	it('parses an empty document to empty regions', () => {
		const parsed = parseDocument({ path: 'A.md', content: '' });
		expect(parsed).toEqual({
			path: 'A.md',
			lines: [''],
			headings: [],
			links: [],
			tokens: [],
			terms: [],
		});
	});

	it('extracts a heading with its 1-based line', () => {
		const parsed = parseDocument({ path: 'A.md', content: '# Title\n' });
		expect(parsed.headings).toEqual([{ text: 'Title', line: 1 }]);
	});

	it('extracts every heading level with its text', () => {
		const content = '# One\n\n### Three deep\n';
		expect(parseDocument({ path: 'A.md', content }).headings).toEqual([
			{ text: 'One', line: 1 },
			{ text: 'Three deep', line: 3 },
		]);
	});

	it('extracts an inline link with text, target, and line', () => {
		const content = 'see [the docs](./DOCS.md#phases) here\n';
		expect(parseDocument({ path: 'A.md', content }).links).toEqual([
			{ text: 'the docs', target: './DOCS.md#phases', line: 1 },
		]);
	});

	it('extracts multiple links from one line', () => {
		const content = '[a](x.md) and [b](y.md)\n';
		expect(
			parseDocument({ path: 'A.md', content }).links.map((l) => l.target),
		).toEqual(['x.md', 'y.md']);
	});

	it('extracts single-line backticked tokens', () => {
		const content = 'run `npm run lint` before `git commit`\n';
		expect(
			parseDocument({ path: 'A.md', content }).tokens.map((t) => t.text),
		).toEqual(['npm run lint', 'git commit']);
	});

	describe('fence blanking preserves line numbering', () => {
		const content = '```js\nconst x = 1;\n```\n# After\n';

		it('blanks the fenced line', () => {
			expect(parseDocument({ path: 'A.md', content }).lines[1]).toBe('');
		});

		it('keeps the post-fence heading at its real line', () => {
			expect(parseDocument({ path: 'A.md', content }).headings).toEqual([
				{ text: 'After', line: 4 },
			]);
		});

		it("keeps a non-fenced line's own text", () => {
			expect(parseDocument({ path: 'A.md', content }).lines[3]).toBe('# After');
		});
	});

	it('does not extract tokens from inside fenced blocks', () => {
		const content = '```\n`fenced token`\n```\n';
		expect(parseDocument({ path: 'A.md', content }).tokens).toEqual([]);
	});

	// PINNED(AR-4 BLOCKER fix 2026-07-29: CommonMark run-length fence nesting —
	// a longer fence wraps a shorter one as content; reproduced live on DEV.md)
	describe('a longer fence wraps a shorter fence as content', () => {
		const content =
			'````markdown\n```mermaid\nflowchart TD\n    A[inner label] --> B[inner too]\n```\n# Fenced heading\n`fenced token`\n````\n# Real heading\n';

		it('keeps the wrapped mermaid body blanked', () => {
			expect(parseDocument({ path: 'A.md', content }).lines[3]).toBe('');
		});

		it('does not read the fenced heading', () => {
			expect(parseDocument({ path: 'A.md', content }).headings).toEqual([
				{ text: 'Real heading', line: 9 },
			]);
		});

		it('does not read the fenced token', () => {
			expect(parseDocument({ path: 'A.md', content }).tokens).toEqual([]);
		});

		it('does not mine mermaid labels from the illustrated inner fence', () => {
			const terms = parseDocument({ path: 'A.md', content }).terms;
			expect(terms.filter((t) => t.kind === 'mermaid-node')).toEqual([]);
		});
	});

	it('does not read a link whose target sits inside a code span', () => {
		const content = 'forms `#<fragment>`, `[text](target)` only\n';
		expect(parseDocument({ path: 'A.md', content }).links).toEqual([]);
	});

	it('does not split a multi-backtick span across lines', () => {
		const content = 'a `start\nend` b\n';
		expect(parseDocument({ path: 'A.md', content }).tokens).toEqual([]);
	});

	it('reads a double-backtick span as one token', () => {
		const content = 'the ``7. No `this` Keyword`` heading\n';
		expect(
			parseDocument({ path: 'A.md', content }).tokens.map((t) => t.text),
		).toEqual(['7. No `this` Keyword']);
	});

	it('extracts bold terms as terms', () => {
		const content = 'the **loss ledger** must answer\n';
		expect(parseDocument({ path: 'A.md', content }).terms).toContainEqual({
			kind: 'bold',
			term: 'loss ledger',
			line: 1,
			sourcePath: 'A.md',
		});
	});

	describe('a mermaid fence is blanked for indexing and mined for terms', () => {
		const content =
			'```mermaid\nflowchart TD\n    A[corpus paths] --> B[documents]\n```\n# After\n';

		it('blanks the mermaid lines', () => {
			expect(parseDocument({ path: 'A.md', content }).lines[2]).toBe('');
		});

		it('keeps the post-fence heading at its real line', () => {
			expect(parseDocument({ path: 'A.md', content }).headings).toEqual([
				{ text: 'After', line: 5 },
			]);
		});

		it('extracts each node label with its real line', () => {
			const terms = parseDocument({ path: 'A.md', content }).terms;
			expect(terms.filter((t) => t.kind === 'mermaid-node')).toEqual([
				{
					kind: 'mermaid-node',
					term: 'corpus paths',
					line: 3,
					sourcePath: 'A.md',
				},
				{
					kind: 'mermaid-node',
					term: 'documents',
					line: 3,
					sourcePath: 'A.md',
				},
			]);
		});
	});

	describe('terms include heading- and token-kind entries', () => {
		const content = '# Title\n\nuse `npm run lint`\n';

		it('carries the heading as a heading-kind term', () => {
			expect(parseDocument({ path: 'A.md', content }).terms).toContainEqual({
				kind: 'heading',
				term: 'Title',
				line: 1,
				sourcePath: 'A.md',
			});
		});

		it('carries the token as a token-kind term', () => {
			expect(parseDocument({ path: 'A.md', content }).terms).toContainEqual({
				kind: 'token',
				term: 'npm run lint',
				line: 3,
				sourcePath: 'A.md',
			});
		});
	});
});
