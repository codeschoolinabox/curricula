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

// ─── Helpers for asserting mdxJsxFlowElement StudyLenses nodes ────────────────

type StudyLensJsx = {
	type: 'mdxJsxFlowElement';
	name: 'StudyLenses';
	attributes: ReadonlyArray<{ name: string; value: string }>;
	children: [];
};

function findStudyLensNode(
	children: Root['children'],
): StudyLensJsx | undefined {
	return children.find(
		(n) =>
			(n as { type: string }).type === 'mdxJsxFlowElement' &&
			(n as { name?: string }).name === 'StudyLenses',
	) as StudyLensJsx | undefined;
}

function attrsOf(node: StudyLensJsx | undefined): Record<string, string> {
	return Object.fromEntries(
		(node?.attributes ?? []).map((a) => [a.name, a.value]),
	);
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

	it('configured fence (defaults.js=study) → code node replaced by mdxJsxFlowElement StudyLenses', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-js');
		const mdFile = path.join(contentRoot, 'index.md');

		const tree = parseAndTransform(mdFile, contentRoot);
		const jsxNode = findStudyLensNode(tree.children);

		expect(jsxNode?.type).toBe('mdxJsxFlowElement');
		expect(jsxNode?.name).toBe('StudyLenses');
		expect(jsxNode?.children).toEqual([]);
		expect(attrsOf(jsxNode)).toMatchObject({
			code: 'let x = 1;',
			lens: 'study',
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
		});
	});

	it('configured python: defaults.python=study + ```python → fence transforms with lens=study', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-python');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const jsxNode = findStudyLensNode(tree.children);
		expect(attrsOf(jsxNode)).toMatchObject({
			lens: 'study',
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
		expect(jsxNode?.name).toBe('StudyLenses');
		// txt (unconfigured) and no-lang fences remain as plain code nodes
		const remainingCodeNodes = tree.children.filter((n) => n.type === 'code');
		expect(remainingCodeNodes).toHaveLength(2);
		remainingCodeNodes.forEach((n) => {
			expect((n as { data?: unknown }).data).toBeUndefined();
		});
	});

	it('embed bottom: index.md + two .js siblings → two mdxJsxFlowElement StudyLenses nodes appended', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'embed-bottom');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		// The last two children should be the appended siblings in alphabetical label order.
		const appended = tree.children.slice(-2) as unknown as StudyLensJsx[];
		expect(appended.every((n) => n.type === 'mdxJsxFlowElement')).toBe(true);
		expect(appended.every((n) => n.name === 'StudyLenses')).toBe(true);
		expect(attrsOf(appended[0])).toMatchObject({
			code: '// alpha sibling\nconst a = 1;\n',
			lens: 'study',
		});
		expect(attrsOf(appended[1])).toMatchObject({
			code: '// beta sibling\nconst b = 2;\n',
			lens: 'study',
		});
		// B.2: appendBottomEmbed path emits no `lang` attribute.
		expect(attrsOf(appended[0]).lang).toBeUndefined();
		expect(attrsOf(appended[1]).lang).toBeUndefined();
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
				(n as { name?: string }).name === 'StudyLenses',
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
		// then one mdxJsxFlowElement StudyLenses per sibling.
		const heading = tree.children.at(-2);
		const lastNode = tree.children.at(-1);
		expect(heading?.type).toBe('heading');
		expect((heading as { depth?: number }).depth).toBe(2);
		expect(
			(heading as { children?: Array<{ type: string; value?: string }> })
				.children?.[0]?.value,
		).toBe('Exercises');
		expect((lastNode as { type: string }).type).toBe('mdxJsxFlowElement');
		expect((lastNode as { name?: string }).name).toBe('StudyLenses');
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
				children?: ReadonlyArray<{
					type: string;
					name?: string;
					attributes?: ReadonlyArray<{ name: string; value: unknown }>;
				}>;
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

		// First TabItem's sole child is a StudyLenses mdxJsxFlowElement
		// (same emission shape as root-level fences and bottom-mode embeds).
		const innerJsx = tabItems[0]?.children?.[0];
		expect(innerJsx?.type).toBe('mdxJsxFlowElement');
		expect(innerJsx?.name).toBe('StudyLenses');
		const innerAttrs = Object.fromEntries(
			(innerJsx?.attributes ?? []).map((a) => [a.name, a.value]),
		);
		expect(innerAttrs.lens).toBe('study');
		expect(innerAttrs.lang).toBeUndefined();
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
		expect(appended?.name).toBe('StudyLenses');
		const attrs = attrsOf(appended);
		expect(attrs.lens).toBe('parsons');
		// Merged: cascade shuffleSeed=42 + directive distractors=4.
		expect(attrs.config).toBe(
			JSON.stringify({ shuffleSeed: 42, distractors: 4 }),
		);
		// Byte-exact: the directive JSDoc is stripped from the emitted
		// code attribute. The fixture's exercise.js is a 6-line file;
		// after strip only the `const puzzle = '...';\n` line remains.
		expect(attrs.code).toBe(
			"const puzzle = 'shuffleSeed inherited from cascade; distractors from directive';\n",
		);
	});

	it('D.16: trailing-placement directive behaves identically to leading-placement', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'embed-config-merge-trailing');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const appended = tree.children.at(-1) as unknown as StudyLensJsx;
		expect(appended?.type).toBe('mdxJsxFlowElement');
		expect(appended?.name).toBe('StudyLenses');
		const attrs = attrsOf(appended);
		expect(attrs.lens).toBe('parsons');
		expect(attrs.config).toBe(
			JSON.stringify({ shuffleSeed: 42, distractors: 4 }),
		);
		// Byte-exact: same stripped content regardless of directive placement.
		expect(attrs.code).toBe(
			"const puzzle = 'shuffleSeed inherited from cascade; distractors from directive';\n",
		);
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
				(n as { name?: string }).name === 'StudyLenses',
		) as unknown as StudyLensJsx[];

		// Plain ```js fence: frontmatter wins over cascade (study → highlight)
		expect(attrsOf(jsxNodes[0])).toMatchObject({
			lens: 'highlight',
		});
		// ```js:study fence: explicit suffix beats frontmatter
		expect(attrsOf(jsxNodes[1])).toMatchObject({
			lens: 'study',
		});
	});

	it('manually-placed <StudyLenses> JSX element is NOT touched by the plugin', () => {
		// Programmatic tree: one pre-existing mdxJsxFlowElement (simulating
		// author-placed JSX in an .mdx file) + one ```js fence. After the
		// transformer runs, the JSX node is byte-identical; the code node
		// is replaced by a new mdxJsxFlowElement emitted by codeBlockToJsx.
		const contentRoot = path.join(FIXTURES_DIR, 'configured-js');
		const transformer = createRemarkStudyLenses({ contentRoot });

		const jsxNode = {
			type: 'mdxJsxFlowElement',
			name: 'StudyLenses',
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
		// Code node replaced by a new mdxJsxFlowElement StudyLenses
		const replaced = tree.children[1] as unknown as StudyLensJsx;
		expect(replaced.type).toBe('mdxJsxFlowElement');
		expect(replaced.name).toBe('StudyLenses');
		expect(attrsOf(replaced)).toMatchObject({
			code: 'let x = 1;',
			lens: 'study',
		});
	});

	// ─── Grouped sibling embeds (D.17–D.20) ──────────────────────────────

	it('D.17: tabs mode with two subdir groups → two separate <Tabs> with headings', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'grouped-tabs');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		// After the heading child, expect: heading(group-a) + Tabs(group-a) +
		// heading(group-b) + Tabs(group-b) = 4 appended nodes.
		const appended = tree.children.slice(1); // skip the original heading
		expect(appended).toHaveLength(4);

		// Group A heading (depth 3)
		expect(appended[0]?.type).toBe('heading');
		expect((appended[0] as { depth?: number }).depth).toBe(3);

		// Group A Tabs with 2 TabItems
		const tabsA = appended[1] as unknown as {
			type: string;
			name?: string;
			children?: ReadonlyArray<{
				type: string;
				name?: string;
				attributes?: ReadonlyArray<{ name: string; value: unknown }>;
			}>;
		};
		expect(tabsA.type).toBe('mdxJsxFlowElement');
		expect(tabsA.name).toBe('Tabs');
		const tabItemsA = (tabsA.children ?? []).filter(
			(c) => c.type === 'mdxJsxFlowElement' && c.name === 'TabItem',
		);
		expect(tabItemsA).toHaveLength(2);
		// Labels should be group-relative (no 'group-a/' prefix)
		const firstLabel = Object.fromEntries(
			(tabItemsA[0]?.attributes ?? []).map((a) => [a.name, a.value]),
		);
		expect(firstLabel.label).toBe('01');

		// Group B heading (depth 3)
		expect(appended[2]?.type).toBe('heading');

		// Group B Tabs with 1 TabItem
		const tabsB = appended[3] as unknown as typeof tabsA;
		expect(tabsB.name).toBe('Tabs');
		const tabItemsB = (tabsB.children ?? []).filter(
			(c) => c.type === 'mdxJsxFlowElement' && c.name === 'TabItem',
		);
		expect(tabItemsB).toHaveLength(1);
	});

	it('D.18: mixed root + subdir → root group first with sectionHeading, then subdir group', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'grouped-mixed');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const appended = tree.children.slice(1);
		// Root heading (depth 2, "Exercises") + root Tabs + subdir heading (depth 3) + subdir Tabs = 4
		expect(appended).toHaveLength(4);

		// Root section heading
		expect(appended[0]?.type).toBe('heading');
		expect((appended[0] as { depth?: number }).depth).toBe(2);
		expect(
			(appended[0] as { children?: Array<{ value?: string }> }).children?.[0]
				?.value,
		).toBe('Exercises');

		// Root group Tabs (one tab: root.js)
		const rootTabs = appended[1] as unknown as {
			type: string;
			name?: string;
			children?: ReadonlyArray<{ type: string; name?: string }>;
		};
		expect(rootTabs.name).toBe('Tabs');
		expect(
			rootTabs.children?.filter(
				(c) => c.type === 'mdxJsxFlowElement' && c.name === 'TabItem',
			),
		).toHaveLength(1);

		// Subdir heading (depth 3)
		expect(appended[2]?.type).toBe('heading');
		expect((appended[2] as { depth?: number }).depth).toBe(3);

		// Subdir Tabs (one tab: 01.js)
		const subdirTabs = appended[3] as unknown as typeof rootTabs;
		expect(subdirTabs.name).toBe('Tabs');
	});

	it('D.19: bottom mode with groups → per-file StudyLenses nodes with headings between groups', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'grouped-bottom');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const appended = tree.children.slice(1);
		// group-a heading + 2 StudyLenses + group-b heading + 1 StudyLenses = 5
		expect(appended).toHaveLength(5);

		// Group A heading
		expect(appended[0]?.type).toBe('heading');
		expect((appended[0] as { depth?: number }).depth).toBe(3);

		// Two StudyLenses nodes for group-a
		expect((appended[1] as { type: string }).type).toBe('mdxJsxFlowElement');
		expect((appended[2] as { type: string }).type).toBe('mdxJsxFlowElement');

		// Group B heading
		expect(appended[3]?.type).toBe('heading');

		// One StudyLenses for group-b
		expect((appended[4] as { type: string }).type).toBe('mdxJsxFlowElement');
	});

	it('D.20: single subdir, no root files → one group Tabs, no empty root group', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'grouped-single-subdir');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const appended = tree.children.slice(1);
		// exercises heading + Tabs = 2 nodes (no root group)
		expect(appended).toHaveLength(2);
		expect(appended[0]?.type).toBe('heading');
		const tabs = appended[1] as unknown as {
			type: string;
			name?: string;
			children?: ReadonlyArray<{ type: string; name?: string }>;
		};
		expect(tabs.name).toBe('Tabs');
		expect(
			tabs.children?.filter(
				(c) => c.type === 'mdxJsxFlowElement' && c.name === 'TabItem',
			),
		).toHaveLength(2);
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

	// ─── Option-A: comma-separated fence syntax ──────────────────────────
	//
	// Tests use the `configured-js` fixture dir (defaults.js=study) with a
	// synthetic vfile path so the cascade resolver finds the real lenses.json
	// while the fence content comes from the parsed string directly.

	function parseStringInConfiguredJs(md: string): Root {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-js');
		const transformer = createRemarkStudyLenses({ contentRoot });
		const vfile = new VFile({
			value: md,
			path: path.join(contentRoot, 'index.md'),
		});
		const tree = unified().use(remarkParse).parse(vfile) as Root;
		transformer(tree, vfile);
		return tree;
	}

	it('B.2: integration — emitted JSX never carries a `lang` attribute (configured-js fence)', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-js');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attrs = attrsOf(jsxNode);

		expect(attrs.lens).toBe('study');
		expect(attrs.code).toBe('let x = 1;');
		expect(attrs.lang).toBeUndefined();
	});

	it('B.2: integration — emitted JSX never carries a `lang` attribute (configured-python fence)', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-python');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attrs = attrsOf(jsxNode);

		expect(attrs.lens).toBe('study');
		expect(attrs.code).toBe("print('hello')");
		expect(attrs.lang).toBeUndefined();
	});

	it('B.1: js:editor (no comma) → lens=editor, no transforms attribute, code survives', () => {
		const tree = parseStringInConfiguredJs('```js:editor\nlet x = 1;\n```\n');
		const jsxNode = findStudyLensNode(tree.children);
		const attrs = attrsOf(jsxNode);

		expect(attrs.lens).toBe('editor');
		expect(attrs.code).toBe('let x = 1;');
		expect(attrs.transforms).toBeUndefined();
	});

	it('B.1: js:format,editor → lens=editor, no transforms attribute, code survives', () => {
		const tree = parseStringInConfiguredJs(
			'```js:format,editor\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attrs = attrsOf(jsxNode);

		expect(attrs.lens).toBe('editor');
		expect(attrs.code).toBe('let x = 1;');
		expect(attrs.transforms).toBeUndefined();
	});

	it('B.1: js:format,loopGuard,editor → lens=editor, no transforms attribute, code survives', () => {
		const tree = parseStringInConfiguredJs(
			'```js:format,loopGuard,editor\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attrs = attrsOf(jsxNode);

		expect(attrs.lens).toBe('editor');
		expect(attrs.code).toBe('let x = 1;');
		expect(attrs.transforms).toBeUndefined();
	});

	it('Option-A malformed: js:,editor (leading empty token) → fence NOT transformed', () => {
		const tree = parseStringInConfiguredJs('```js:,editor\nlet x = 1;\n```\n');

		// No StudyLenses node emitted; original code node preserved
		expect(findStudyLensNode(tree.children)).toBeUndefined();
		const codeNode = tree.children.find((n) => n.type === 'code');
		expect(codeNode).toBeDefined();
	});

	it('Option-A malformed: js:format,,editor (double comma) → fence NOT transformed', () => {
		const tree = parseStringInConfiguredJs(
			'```js:format,,editor\nlet x = 1;\n```\n',
		);

		expect(findStudyLensNode(tree.children)).toBeUndefined();
		const codeNode = tree.children.find((n) => n.type === 'code');
		expect(codeNode).toBeDefined();
	});
});
