import { describe, expect, it } from 'vitest';
import checkLinks from '../links.mjs';
import parseDocument from '../parse.mjs';

function snapshot(overrides = {}) {
	return {
		npmScripts: [],
		binTools: [],
		existingPaths: new Set<string>(),
		headingsByPath: {},
		matchingGlobs: new Set<string>(),
		ignoredPaths: new Set<string>(),
		...overrides,
	};
}

function parsed(path: string, content: string) {
	return [parseDocument({ path, content })];
}

describe('checkLinks', () => {
	it('reports nothing for a document with no links', () => {
		const docs = parsed('A.md', '# Title\nplain prose\n');
		expect(checkLinks(docs, snapshot())).toEqual([]);
	});

	it('reports a dead same-document fragment as an error', () => {
		const docs = parsed('A.md', '# Title\n[go](#missing)\n');
		expect(checkLinks(docs, snapshot())).toEqual([
			{
				path: 'A.md',
				line: 2,
				check: 'links',
				severity: 'error',
				message: expect.stringContaining('#missing'),
			},
		]);
	});

	it('accepts a live same-document fragment', () => {
		const docs = parsed('A.md', '# Data flow\n[go](#data-flow)\n');
		expect(checkLinks(docs, snapshot())).toEqual([]);
	});

	it('resolves duplicate-heading fragments github-style', () => {
		const content = '# Data flow\n# Data flow\n[go](#data-flow-1)\n';
		expect(checkLinks(parsed('A.md', content), snapshot())).toEqual([]);
	});

	it('reports a missing relative file as an error', () => {
		const docs = parsed('scripts/A.md', '[go](./GONE.md)\n');
		expect(checkLinks(docs, snapshot())).toEqual([
			{
				path: 'scripts/A.md',
				line: 1,
				check: 'links',
				severity: 'error',
				message: expect.stringContaining('scripts/GONE.md'),
			},
		]);
	});

	it('accepts a relative file present in the snapshot', () => {
		const docs = parsed('scripts/A.md', '[go](./B.md)\n');
		const snap = snapshot({ existingPaths: new Set(['scripts/B.md']) });
		expect(checkLinks(docs, snap)).toEqual([]);
	});

	it('resolves parent-directory links from the document directory', () => {
		const docs = parsed('scripts/A.md', '[go](../DEV.md)\n');
		const snap = snapshot({ existingPaths: new Set(['DEV.md']) });
		expect(checkLinks(docs, snap)).toEqual([]);
	});

	it('resolves a bare filename+fragment link from a root-level document', () => {
		const docs = parsed(
			'DEV.md',
			'[go](AGENTS.md#non-negotiable-invariants)\n',
		);
		const snap = snapshot({
			existingPaths: new Set(['AGENTS.md']),
			headingsByPath: { 'AGENTS.md': ['Non-Negotiable Invariants'] },
		});
		expect(checkLinks(docs, snap)).toEqual([]);
	});

	it('reports a dead fragment on an existing cross-document target', () => {
		const docs = parsed('A.md', '[go](./B.md#missing)\n');
		const snap = snapshot({
			existingPaths: new Set(['B.md']),
			headingsByPath: { 'B.md': ['Present heading'] },
		});
		expect(checkLinks(docs, snap)).toEqual([
			{
				path: 'A.md',
				line: 1,
				check: 'links',
				severity: 'error',
				message: expect.stringContaining('#missing'),
			},
		]);
	});

	it('accepts a live fragment on an existing cross-document target', () => {
		const docs = parsed('A.md', '[go](./B.md#present-heading)\n');
		const snap = snapshot({
			existingPaths: new Set(['B.md']),
			headingsByPath: { 'B.md': ['Present heading'] },
		});
		expect(checkLinks(docs, snap)).toEqual([]);
	});

	it('resolves a duplicate-heading fragment on a cross-document target', () => {
		const docs = parsed('A.md', '[go](./B.md#data-flow-1)\n');
		const snap = snapshot({
			existingPaths: new Set(['B.md']),
			headingsByPath: { 'B.md': ['Data flow', 'Data flow'] },
		});
		expect(checkLinks(docs, snap)).toEqual([]);
	});

	it('attributes a dead link to the right document among several', () => {
		const docs = [
			...parsed('A.md', '# Title\nclean\n'),
			...parsed('B.md', '[go](#missing)\n'),
		];
		expect(checkLinks(docs, snapshot())).toEqual([
			{
				path: 'B.md',
				line: 1,
				check: 'links',
				severity: 'error',
				message: expect.stringContaining('#missing'),
			},
		]);
	});

	it('skips http and https urls', () => {
		const content = '[a](https://example.com) [b](http://example.com)\n';
		expect(checkLinks(parsed('A.md', content), snapshot())).toEqual([]);
	});

	it('skips root-relative docusaurus routes', () => {
		const docs = parsed('A.md', '[route](/docs/welcome)\n');
		expect(checkLinks(docs, snapshot())).toEqual([]);
	});

	it('skips non-path targets such as mail schemes', () => {
		const docs = parsed('A.md', '[mail](mailto:someone@example.com)\n');
		expect(checkLinks(docs, snapshot())).toEqual([]);
	});

	it('skips a target containing spaces as a non-path', () => {
		const docs = parsed('A.md', '[odd](click here)\n');
		expect(checkLinks(docs, snapshot())).toEqual([]);
	});

	it('reports each dead link on a line with several', () => {
		const content = '[a](#gone) and [b](#also-gone)\n';
		expect(checkLinks(parsed('A.md', content), snapshot())).toHaveLength(2);
	});
});
