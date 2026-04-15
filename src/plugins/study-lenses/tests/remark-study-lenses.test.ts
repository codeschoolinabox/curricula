/**
 * @file Unit tests for the remark plugin orchestrator.
 *
 * Fixtures under `./fixtures/remark-study-lenses/` are on-disk
 * directory trees mirroring real docs-instance layouts. Each `.md`
 * fixture lives inside a `contentRoot` directory; the test reads the
 * markdown, runs it through `unified().use(remarkParse).use(ours)`,
 * and asserts against the resulting MDAST.
 */

import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { VFile } from 'vfile';

import createRemarkStudyLenses from '../remark-study-lenses.js';

import type { Root } from 'mdast';

const FIXTURES_DIR = path.resolve(
	import.meta.dirname,
	'fixtures',
	'remark-study-lenses',
);

function parseAndTransform(
	absFilePath: string,
	contentRoot: string,
): Root {
	const source = fs.readFileSync(absFilePath, 'utf8');
	const transformer = createRemarkStudyLenses({ contentRoot });
	const vfile = new VFile({ value: source, path: absFilePath });
	const parser = unified().use(remarkParse);
	const tree = parser.parse(vfile) as Root;
	transformer(tree, vfile);
	return tree;
}

describe('createRemarkStudyLenses', () => {
	it('vfile path outside contentRoot → tree unchanged (guard)', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'some-root');
		const transformer = createRemarkStudyLenses({ contentRoot });
		const vfile = new VFile({
			value: '```js\nlet x=1;\n```\n',
			path: '/totally/unrelated/path/file.md',
		});
		const tree = unified().use(remarkParse).parse(vfile) as Root;
		const before = JSON.stringify(tree);

		transformer(tree, vfile);

		expect(JSON.stringify(tree)).toBe(before);
	});

	it('fence with lang not in defaults → left unchanged (configured-languages rule)', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'no-configured-langs');
		const mdFile = path.join(contentRoot, 'page.md');

		const tree = parseAndTransform(mdFile, contentRoot);
		const codeNode = tree.children.find(
			(n): n is Extract<Root['children'][number], { type: 'code' }> =>
				n.type === 'code',
		);

		expect(codeNode?.lang).toBe('txt');
		expect(codeNode?.data).toBeUndefined();
	});

	it('configured fence (defaults.js=study) → code node gains hName StudyLens', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-js');
		const mdFile = path.join(contentRoot, 'page.md');

		const tree = parseAndTransform(mdFile, contentRoot);
		const codeNode = tree.children.find(
			(n): n is Extract<Root['children'][number], { type: 'code' }> =>
				n.type === 'code',
		);

		expect(codeNode?.data).toEqual({
			hName: 'StudyLens',
			hProperties: {
				code: 'let x = 1;',
				lens: 'study',
				lang: 'js',
			},
		});
	});

	it('cascade-driven default: defaults.js=highlight in lenses.json → plain ```js picks up highlight', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'cascade-defaults');
		const tree = parseAndTransform(
			path.join(contentRoot, 'page.md'),
			contentRoot,
		);
		const codeNode = tree.children.find(
			(n): n is Extract<Root['children'][number], { type: 'code' }> =>
				n.type === 'code',
		);
		expect(codeNode?.data?.hProperties).toMatchObject({
			lens: 'highlight',
			lang: 'js',
		});
	});

	it('explicit suffix wins: ```js:highlight overrides defaults.js=study', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'suffix-overrides');
		const tree = parseAndTransform(
			path.join(contentRoot, 'page.md'),
			contentRoot,
		);
		const codeNode = tree.children.find(
			(n): n is Extract<Root['children'][number], { type: 'code' }> =>
				n.type === 'code',
		);
		expect(codeNode?.data?.hProperties).toMatchObject({
			lens: 'highlight',
			lang: 'js',
		});
	});

	it('configured python: defaults.python=study + ```python → transformed with lang=python', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-python');
		const tree = parseAndTransform(
			path.join(contentRoot, 'page.md'),
			contentRoot,
		);
		const codeNode = tree.children.find(
			(n): n is Extract<Root['children'][number], { type: 'code' }> =>
				n.type === 'code',
		);
		expect(codeNode?.data?.hProperties).toMatchObject({
			lens: 'study',
			lang: 'python',
		});
	});

	it('mixed-language fences: configured ones transform, unconfigured + no-lang stay plain', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'mixed-langs');
		const tree = parseAndTransform(
			path.join(contentRoot, 'page.md'),
			contentRoot,
		);
		const codeNodes = tree.children.filter(
			(n): n is Extract<Root['children'][number], { type: 'code' }> =>
				n.type === 'code',
		);
		// js (configured) → transformed
		expect(codeNodes[0]?.data?.hName).toBe('StudyLens');
		// txt (unconfigured) → unchanged
		expect(codeNodes[1]?.data).toBeUndefined();
		// no language at all → unchanged
		expect(codeNodes[2]?.data).toBeUndefined();
	});

	it('embed bottom: index.md + two .js siblings → two hast-shaped code nodes appended', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'embed-bottom');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		// The last two children should be the appended siblings in alphabetical label order.
		const appended = tree.children.slice(-2);
		expect(appended.every((n) => n.type === 'code')).toBe(true);
		expect(appended[0]?.data).toEqual({
			hName: 'StudyLens',
			hProperties: {
				code: '// alpha sibling\nconst a = 1;\n',
				lens: 'study',
				lang: 'js',
			},
		});
		expect(appended[1]?.data).toEqual({
			hName: 'StudyLens',
			hProperties: {
				code: '// beta sibling\nconst b = 2;\n',
				lens: 'study',
				lang: 'js',
			},
		});
	});

	it('vfile with no path → tree unchanged (guard)', () => {
		const transformer = createRemarkStudyLenses({
			contentRoot: FIXTURES_DIR,
		});
		const vfile = new VFile({ value: '# hi\n\n```js\nlet x=1;\n```\n' });
		const tree = unified().use(remarkParse).parse(vfile) as Root;
		const before = JSON.stringify(tree);

		transformer(tree, vfile);

		expect(JSON.stringify(tree)).toBe(before);
	});
});
