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
	frontMatter?: Record<string, unknown>,
): Root {
	const source = fs.readFileSync(absFilePath, 'utf8');
	const transformer = createRemarkStudyLenses({ contentRoot });
	const vfile = new VFile({
		value: source,
		path: absFilePath,
		data: frontMatter === undefined ? {} : { frontMatter },
	});
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

	it('README.md alone (no sibling index.md) → embeds applied', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'readme-alone');
		const tree = parseAndTransform(
			path.join(contentRoot, 'README.md'),
			contentRoot,
		);
		const appendedCodes = tree.children.filter((n) => n.type === 'code');
		expect(appendedCodes.length).toBeGreaterThanOrEqual(1);
	});

	it('README.md with sibling index.md → README does NOT receive embeds', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'readme-with-index');
		const tree = parseAndTransform(
			path.join(contentRoot, 'README.md'),
			contentRoot,
		);
		const appendedCodes = tree.children.filter((n) => n.type === 'code');
		expect(appendedCodes).toHaveLength(0);
	});

	it('section heading appended before embed block when embedSiblings.sectionHeading is set', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'embed-with-heading');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		// Expect: ...original children..., heading (depth 2, text 'Exercises'),
		// then one code node per sibling.
		const heading = tree.children.at(-2);
		const lastCode = tree.children.at(-1);
		expect(heading?.type).toBe('heading');
		expect((heading as { depth?: number }).depth).toBe(2);
		expect(
			(heading as { children?: Array<{ type: string; value?: string }> })
				.children?.[0]?.value,
		).toBe('Exercises');
		expect(lastCode?.type).toBe('code');
	});

	it('embed-tabs emits mdxJsxFlowElement Tabs wrapping one TabItem per sibling', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'embed-tabs');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const appended = tree.children.at(-1) as unknown as {
			type: string;
			name?: string;
			children?: ReadonlyArray<{
				type: string;
				name?: string;
				attributes?: ReadonlyArray<{ name: string; value: unknown }>;
				children?: ReadonlyArray<{ type: string; data?: { hName?: string } }>;
			}>;
		};

		expect(appended.type).toBe('mdxJsxFlowElement');
		expect(appended.name).toBe('Tabs');

		const tabItems = (appended.children ?? []).filter(
			(c) => c.type === 'mdxJsxFlowElement' && c.name === 'TabItem',
		);
		expect(tabItems).toHaveLength(2);

		// First TabItem's attributes carry value + label from the sibling.
		const firstAttrs = Object.fromEntries(
			(tabItems[0]?.attributes ?? []).map((a) => [a.name, a.value]),
		);
		expect(firstAttrs.value).toBe('01-alpha');
		expect(firstAttrs.label).toBe('01-alpha');

		// First TabItem's sole child is a hast-shaped StudyLens code node.
		const innerCodeNode = tabItems[0]?.children?.[0];
		expect(innerCodeNode?.type).toBe('code');
		expect(innerCodeNode?.data?.hName).toBe('StudyLens');
	});

	it('embed-bottom deep-merges directive lensConfig over cascade lenses[lens]', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'embed-config-merge');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		// The last child is the appended sibling.
		const appended = tree.children.at(-1);
		expect(appended?.type).toBe('code');
		const props = (appended as Extract<Root['children'][number], { type: 'code' }>)
			.data?.hProperties as Record<string, unknown>;
		expect(props?.lens).toBe('parsons');
		// Merged: cascade shuffleSeed=42 + directive distractors=4.
		expect(props?.config).toBe(
			JSON.stringify({ shuffleSeed: 42, distractors: 4 }),
		);
	});

	it('frontmatter defaultLens overrides cascade for plain fences; :suffix still wins', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'frontmatter-default-lens');
		const tree = parseAndTransform(
			path.join(contentRoot, 'page.md'),
			contentRoot,
			{ defaultLens: 'highlight' },
		);
		const codeNodes = tree.children.filter(
			(n): n is Extract<Root['children'][number], { type: 'code' }> =>
				n.type === 'code',
		);

		// Plain ```js fence: frontmatter wins over cascade (study)
		expect(codeNodes[0]?.data?.hProperties).toMatchObject({
			lens: 'highlight',
			lang: 'js',
		});
		// ```js:study fence: explicit suffix beats frontmatter
		expect(codeNodes[1]?.data?.hProperties).toMatchObject({
			lens: 'study',
			lang: 'js',
		});
	});

	it('manually-placed <StudyLens> JSX element is NOT touched by the plugin', () => {
		// Programmatic tree: one pre-existing mdxJsxFlowElement (simulating
		// author-placed JSX in an .mdx file) + one ```js fence. After the
		// transformer runs, the JSX node is byte-identical; the code node
		// gains hast routing.
		const contentRoot = path.join(FIXTURES_DIR, 'configured-js');
		const transformer = createRemarkStudyLenses({ contentRoot });

		const jsxNode = {
			type: 'mdxJsxFlowElement',
			name: 'StudyLens',
			attributes: [
				{ type: 'mdxJsxAttribute', name: 'code', value: 'existing' },
			],
			children: [],
		};
		const jsxSnapshot = JSON.stringify(jsxNode);

		const tree = {
			type: 'root',
			children: [
				jsxNode,
				{ type: 'code', lang: 'js', value: 'let x = 1;', meta: null },
			],
		} as unknown as Root;

		const vfile = new VFile({
			value: '',
			path: path.join(contentRoot, 'page.md'),
		});

		transformer(tree, vfile);

		// JSX node unchanged
		expect(JSON.stringify(tree.children[0])).toBe(jsxSnapshot);
		// Code node transformed
		expect(
			(tree.children[1] as Extract<Root['children'][number], { type: 'code' }>)
				.data?.hName,
		).toBe('StudyLens');
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
