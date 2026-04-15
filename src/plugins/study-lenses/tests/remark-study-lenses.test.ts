/**
 * @file Unit tests for the remark plugin orchestrator.
 *
 * Most fixtures live at `/spiralearn/sandbox/plugin-fixtures/` (they
 * double as live demo pages in the sandbox docs instance). The one
 * holdout, `readme-with-index/`, stays under `./fixtures/` because
 * Docusaurus 3.x routing errors on dirs containing both `README.md`
 * and `index.md` — that co-existence is exactly what the fixture
 * tests, so we keep it out of the live content tree. Each test sets
 * its `contentRoot` to the fixture dir itself, which stops the cascade
 * resolver's walk before it reaches any site-root `lenses.json` —
 * unit-test behavior is insulated from live-site config drift.
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
	'..',
	'..',
	'..',
	'..',
	'spiralearn',
	'sandbox',
	'plugin-fixtures',
);

const LEGACY_FIXTURES_DIR = path.resolve(
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

// ─── Helpers for asserting mdxJsxFlowElement StudyLens nodes ────────────────

type StudyLensJsx = {
	type: 'mdxJsxFlowElement';
	name: 'StudyLens';
	attributes: ReadonlyArray<{ name: string; value: string }>;
	children: [];
};

function findStudyLensNode(children: Root['children']): StudyLensJsx | undefined {
	return children.find(
		(n) =>
			(n as { type: string }).type === 'mdxJsxFlowElement' &&
			(n as { name?: string }).name === 'StudyLens',
	) as StudyLensJsx | undefined;
}

function attrsOf(node: StudyLensJsx | undefined): Record<string, string> {
	return Object.fromEntries((node?.attributes ?? []).map((a) => [a.name, a.value]));
}

// ─── Tests ──────────────────────────────────────────────────────────────────

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
		const mdFile = path.join(contentRoot, 'index.md');

		const tree = parseAndTransform(mdFile, contentRoot);
		const codeNode = tree.children.find(
			(n): n is Extract<Root['children'][number], { type: 'code' }> =>
				n.type === 'code',
		);

		expect(codeNode?.lang).toBe('txt');
		expect(codeNode?.data).toBeUndefined();
	});

	it('configured fence (defaults.js=study) → code node replaced by mdxJsxFlowElement StudyLens', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-js');
		const mdFile = path.join(contentRoot, 'index.md');

		const tree = parseAndTransform(mdFile, contentRoot);
		const jsxNode = findStudyLensNode(tree.children);

		expect(jsxNode?.type).toBe('mdxJsxFlowElement');
		expect(jsxNode?.name).toBe('StudyLens');
		expect(jsxNode?.children).toEqual([]);
		expect(attrsOf(jsxNode)).toMatchObject({
			code: 'let x = 1;',
			lens: 'study',
			lang: 'js',
		});
	});

	it('cascade-driven default: defaults.js=highlight in lenses.json → plain ```js picks up highlight', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'cascade-defaults');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const jsxNode = findStudyLensNode(tree.children);
		expect(attrsOf(jsxNode)).toMatchObject({
			lens: 'highlight',
			lang: 'js',
		});
	});

	it('explicit suffix wins: ```js:highlight overrides defaults.js=study', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'suffix-overrides');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const jsxNode = findStudyLensNode(tree.children);
		expect(attrsOf(jsxNode)).toMatchObject({
			lens: 'highlight',
			lang: 'js',
		});
	});

	it('configured python: defaults.python=study + ```python → transformed with lang=python', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-python');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const jsxNode = findStudyLensNode(tree.children);
		expect(attrsOf(jsxNode)).toMatchObject({
			lens: 'study',
			lang: 'python',
		});
	});

	it('mixed-language fences: configured ones transform, unconfigured + no-lang stay plain', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'mixed-langs');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		// js (configured) → replaced by mdxJsxFlowElement
		const jsxNode = findStudyLensNode(tree.children);
		expect(jsxNode?.type).toBe('mdxJsxFlowElement');
		expect(jsxNode?.name).toBe('StudyLens');
		// txt (unconfigured) and no-lang fences remain as plain code nodes
		const remainingCodeNodes = tree.children.filter((n) => n.type === 'code');
		expect(remainingCodeNodes).toHaveLength(2);
		remainingCodeNodes.forEach((n) => {
			expect((n as { data?: unknown }).data).toBeUndefined();
		});
	});

	it('embed bottom: index.md + two .js siblings → two mdxJsxFlowElement StudyLens nodes appended', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'embed-bottom');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		// The last two children should be the appended siblings in alphabetical label order.
		const appended = tree.children.slice(-2) as unknown as StudyLensJsx[];
		expect(appended.every((n) => n.type === 'mdxJsxFlowElement')).toBe(true);
		expect(appended.every((n) => n.name === 'StudyLens')).toBe(true);
		expect(attrsOf(appended[0])).toMatchObject({
			code: '// alpha sibling\nconst a = 1;\n',
			lens: 'study',
			lang: 'js',
		});
		expect(attrsOf(appended[1])).toMatchObject({
			code: '// beta sibling\nconst b = 2;\n',
			lens: 'study',
			lang: 'js',
		});
	});

	it('README.md alone (no sibling index.md) → embeds applied', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'readme-alone');
		const tree = parseAndTransform(
			path.join(contentRoot, 'README.md'),
			contentRoot,
		);
		const appendedJsx = tree.children.filter(
			(n) =>
				(n as { type: string }).type === 'mdxJsxFlowElement' &&
				(n as { name?: string }).name === 'StudyLens',
		);
		expect(appendedJsx.length).toBeGreaterThanOrEqual(1);
	});

	it('README.md with sibling index.md → README does NOT receive embeds', () => {
		const contentRoot = path.join(LEGACY_FIXTURES_DIR, 'readme-with-index');
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
		// then one mdxJsxFlowElement StudyLens per sibling.
		const heading = tree.children.at(-2);
		const lastNode = tree.children.at(-1);
		expect(heading?.type).toBe('heading');
		expect((heading as { depth?: number }).depth).toBe(2);
		expect(
			(heading as { children?: Array<{ type: string; value?: string }> })
				.children?.[0]?.value,
		).toBe('Exercises');
		expect((lastNode as { type: string }).type).toBe('mdxJsxFlowElement');
		expect((lastNode as { name?: string }).name).toBe('StudyLens');
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
		const appended = tree.children.at(-1) as unknown as StudyLensJsx;
		expect(appended?.type).toBe('mdxJsxFlowElement');
		expect(appended?.name).toBe('StudyLens');
		const attrs = attrsOf(appended);
		expect(attrs.lens).toBe('parsons');
		// Merged: cascade shuffleSeed=42 + directive distractors=4.
		expect(attrs.config).toBe(JSON.stringify({ shuffleSeed: 42, distractors: 4 }));
	});

	it('frontmatter defaultLens overrides cascade for plain fences; :suffix still wins', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'frontmatter-default-lens');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
			{ defaultLens: 'highlight' },
		);
		const jsxNodes = tree.children.filter(
			(n) =>
				(n as { type: string }).type === 'mdxJsxFlowElement' &&
				(n as { name?: string }).name === 'StudyLens',
		) as unknown as StudyLensJsx[];

		// Plain ```js fence: frontmatter wins over cascade (study → highlight)
		expect(attrsOf(jsxNodes[0])).toMatchObject({
			lens: 'highlight',
			lang: 'js',
		});
		// ```js:study fence: explicit suffix beats frontmatter
		expect(attrsOf(jsxNodes[1])).toMatchObject({
			lens: 'study',
			lang: 'js',
		});
	});

	it('manually-placed <StudyLens> JSX element is NOT touched by the plugin', () => {
		// Programmatic tree: one pre-existing mdxJsxFlowElement (simulating
		// author-placed JSX in an .mdx file) + one ```js fence. After the
		// transformer runs, the JSX node is byte-identical; the code node
		// is replaced by a new mdxJsxFlowElement emitted by codeBlockToJsx.
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
			path: path.join(contentRoot, 'index.md'),
		});

		transformer(tree, vfile);

		// Original JSX node unchanged
		expect(JSON.stringify(tree.children[0])).toBe(jsxSnapshot);
		// Code node replaced by a new mdxJsxFlowElement StudyLens
		const replaced = tree.children[1] as unknown as StudyLensJsx;
		expect(replaced.type).toBe('mdxJsxFlowElement');
		expect(replaced.name).toBe('StudyLens');
		expect(attrsOf(replaced)).toMatchObject({
			code: 'let x = 1;',
			lens: 'study',
			lang: 'js',
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
