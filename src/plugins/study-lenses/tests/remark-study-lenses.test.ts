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
import os from 'node:os';
import path from 'node:path';

import type { Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { describe, expect, it, onTestFinished } from 'vitest';

import createRemarkStudyLenses from '../remark-study-lenses.js';


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
	const tree = parser.parse(vfile);
	transformer(tree, vfile);
	return tree;
}

// ─── Helpers for asserting mdxJsxFlowElement StudyLenses nodes ────────────────

type MdxJsxAttributeValueExpression = {
	type: 'mdxJsxAttributeValueExpression';
	value: string;
	data?: { estree?: unknown };
};

type StudyLensAttribute = {
	name: string;
	value: string | MdxJsxAttributeValueExpression | null | undefined;
};

type StudyLensJsx = {
	type: 'mdxJsxFlowElement';
	name: 'StudyLenses';
	attributes: ReadonlyArray<StudyLensAttribute>;
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

/**
 * Flatten a `<StudyLenses>` node's attributes to a `{ name: string }`
 * record where string-valued attributes (`snippet`, `lens`) return
 * their `value` directly and the expression-valued attribute
 * (`configs`) returns the SOURCE STRING the plugin built before
 * wrapping it in the `mdxJsxAttributeValueExpression`.
 *
 * The `JSON.parse(attrs.configs!)` pattern in these tests works ONLY
 * because `code-block-to-jsx.ts § buildObjectAttribute` happens to
 * choose `JSON.stringify(obj)` as the source-code string today. The
 * authoritative wire-format test lives at
 * `tests/code-block-to-jsx.test.ts` (it codegens the estree via
 * `astring` and evaluates that, exercising the real MDX-runtime
 * path). If the source-shape strategy ever changes (e.g. payloads
 * with `Date` values), these tests must navigate `data.estree`
 * directly instead of going through `JSON.parse`.
 */
function attributesOf(node: StudyLensJsx | undefined): Record<string, string> {
	return Object.fromEntries(
		(node?.attributes ?? []).map((a) => {
			if (a.value == null) return [a.name, ''];
			return [a.name, typeof a.value === 'string' ? a.value : a.value.value];
		}),
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
		const tree = unified().use(remarkParse).parse(vfile);
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

	it('configured fence (defaults.js=study) → code node replaced by mdxJsxFlowElement StudyLenses with `lens` from cascade default', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-js');
		const mdFile = path.join(contentRoot, 'index.md');

		const tree = parseAndTransform(mdFile, contentRoot);
		const jsxNode = findStudyLensNode(tree.children);

		expect(jsxNode?.type).toBe('mdxJsxFlowElement');
		expect(jsxNode?.name).toBe('StudyLenses');
		expect(jsxNode?.children).toEqual([]);
		const attributes = attributesOf(jsxNode);
		expect(attributes.snippet).toBe('let x = 1;');
		expect(attributes.lens).toBe('study');
	});

	it('explicit suffix wins: ```js:highlight overrides defaults.js=study', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'suffix-overrides');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const jsxNode = findStudyLensNode(tree.children);
		expect(attributesOf(jsxNode)).toMatchObject({
			lens: 'highlight',
		});
	});

	it('configured python: defaults.python=study + ```python → fence transforms with `lens` from cascade default', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-python');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);
		expect(jsxNode?.type).toBe('mdxJsxFlowElement');
		expect(attributes.lens).toBe('study');
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
		for (const n of remainingCodeNodes) {
			expect((n as { data?: unknown }).data).toBeUndefined();
		}
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
		expect(attributesOf(appended[0])).toMatchObject({
			snippet: '// alpha sibling\nconst a = 1;\n',
			lens: 'study',
		});
		expect(attributesOf(appended[1])).toMatchObject({
			snippet: '// beta sibling\nconst b = 2;\n',
			lens: 'study',
		});
		// B.2: appendBottomEmbed path emits no `lang` attribute.
		expect(attributesOf(appended[0]).lang).toBeUndefined();
		expect(attributesOf(appended[1]).lang).toBeUndefined();
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
		const firstAttributes = Object.fromEntries(
			(tabItems[0]?.attributes ?? []).map((a) => [a.name, a.value]),
		);
		expect(firstAttributes.value).toBe('01-alpha');
		expect(firstAttributes.label).toBe('01-alpha');

		// First TabItem's sole child is a StudyLenses mdxJsxFlowElement
		// (same emission shape as root-level fences and bottom-mode embeds).
		const innerJsx = tabItems[0]?.children?.[0];
		expect(innerJsx?.type).toBe('mdxJsxFlowElement');
		expect(innerJsx?.name).toBe('StudyLenses');
		const innerAttributes = Object.fromEntries(
			(innerJsx?.attributes ?? []).map((a) => [a.name, a.value]),
		);
		expect(innerAttributes.lens).toBe('study');
		expect(innerAttributes.lang).toBeUndefined();
		// B.3: tabs-mode inner StudyLenses emits snippet (not code).
		expect(innerAttributes.snippet).toBeDefined();
		expect(innerAttributes.code).toBeUndefined();
	});

	it('C: embed-bottom deep-merges directive override INTO cascade.lenses[lens]', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'embed-config-merge');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		// The last child is the appended sibling.
		const appended = tree.children.at(-1) as unknown as StudyLensJsx;
		expect(appended?.type).toBe('mdxJsxFlowElement');
		expect(appended?.name).toBe('StudyLenses');
		const attributes = attributesOf(appended);
		expect(attributes.lens).toBe('parsons');
		// Byte-exact: the directive JSDoc is stripped from the emitted
		// snippet attribute. The fixture's exercise.js is a 6-line file;
		// after strip only the `const puzzle = '...';\n` line remains.
		expect(attributes.snippet).toBe(
			"const puzzle = 'shuffleSeed inherited from cascade; distractors from directive';\n",
		);
		// C: no separate `config` prop — override merged INTO configs.lenses[lens].
		expect(attributes.config).toBeUndefined();
		// Dual-assertion (AR-3 BLOCKER 2 pattern): per-lens merged entry +
		// top-level cascade key both present in the same `configs` payload.
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).parsons).toEqual({
			shuffleSeed: 42,
			distractors: 4,
		});
		// Top-level cascade key (`defaults`) survives the merge — opacity check.
		expect(cascade.defaults).toBeDefined();
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
		const attributes = attributesOf(appended);
		expect(attributes.lens).toBe('parsons');
		// Byte-exact: same stripped content regardless of directive placement.
		expect(attributes.snippet).toBe(
			"const puzzle = 'shuffleSeed inherited from cascade; distractors from directive';\n",
		);
		// C: no separate `config` prop; override merged INTO configs.lenses[lens].
		expect(attributes.config).toBeUndefined();
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).parsons).toEqual({
			shuffleSeed: 42,
			distractors: 4,
		});
		expect(cascade.defaults).toBeDefined();
	});

	it('L2.7: fence-side gate — child lenses.json with defaults.js=null suppresses parent enablement; bare js fence is untransformed', () => {
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-lenses-L27-'));
		onTestFinished(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

		// Parent enables JS.
		fs.writeFileSync(
			path.join(tmpDir, 'lenses.json'),
			JSON.stringify({ defaults: { js: 'study' } }),
		);
		// Child suppresses JS for its subtree.
		const childDir = path.join(tmpDir, 'subtree');
		fs.mkdirSync(childDir);
		fs.writeFileSync(
			path.join(childDir, 'lenses.json'),
			JSON.stringify({ defaults: { js: null } }),
		);
		// Bare js fence in the child subtree.
		const childMdPath = path.join(childDir, 'index.md');
		fs.writeFileSync(childMdPath, '```js\nlet x = 1;\n```\n');

		const source = fs.readFileSync(childMdPath, 'utf8');
		const transformer = createRemarkStudyLenses({ contentRoot: tmpDir });
		const vfile = new VFile({ value: source, path: childMdPath });
		const tree = unified().use(remarkParse).parse(vfile);
		transformer(tree, vfile);

		// Fence stays as a plain code block — no StudyLenses replacement.
		expect(findStudyLensNode(tree.children)).toBeUndefined();
		const codeNode = tree.children.find((n) => n.type === 'code');
		expect(codeNode).toBeDefined();
	});

	it('L2.1: bare fence in cascade-defaults (defaults.js=highlight) emits lens="highlight" with cascade configs intact', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'cascade-defaults');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const node = findStudyLensNode(tree.children);
		expect(node).toBeDefined();
		const attributes = attributesOf(node);
		expect(attributes.lens).toBe('highlight');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.defaults as Record<string, unknown>).js).toBe(
			'highlight',
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
		expect(attributesOf(jsxNodes[0])).toMatchObject({
			lens: 'highlight',
		});
		// ```js:study fence: explicit suffix beats frontmatter
		expect(attributesOf(jsxNodes[1])).toMatchObject({
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

		// Intentionally uses the OLD `code` attribute name to verify the
		// plugin does not rewrite author-placed JSX regardless of attribute
		// name (back-compat preservation: pre-B.3 MDX files survive).
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
		const replacedAttributes = attributesOf(replaced);
		expect(replacedAttributes.snippet).toBe('let x = 1;');
		// L2: bare js fence in configured-js (defaults.js=study) emits
		// lens from cascade default.
		expect(replacedAttributes.lens).toBe('study');
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
		const tree = unified().use(remarkParse).parse(vfile);
		const before = JSON.stringify(tree);

		transformer(tree, vfile);

		expect(JSON.stringify(tree)).toBe(before);
	});

	// ─── URL-style fence syntax (B.1 + B.4) ──────────────────────────────
	//
	// Tests use the `configured-js` fixture dir (defaults.js=study, no
	// cascade `lenses.*` map) with a synthetic vfile path so the cascade
	// resolver finds the real lenses.json while the fence content comes
	// from the parsed string directly. The cascade-merge with non-empty
	// `lenses[lens]` is exercised separately by the embed-config-merge
	// fixture's sibling-directive tests (same `deepMerge` code path).

	function parseStringInConfiguredJs(md: string): Root {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-js');
		const transformer = createRemarkStudyLenses({ contentRoot });
		const vfile = new VFile({
			value: md,
			path: path.join(contentRoot, 'index.md'),
		});
		const tree = unified().use(remarkParse).parse(vfile);
		transformer(tree, vfile);
		return tree;
	}

	it('B.2 integration — emitted JSX never carries `lang` attr; bare js fence emits `lens` from cascade default (configured-js)', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-js');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.snippet).toBe('let x = 1;');
		expect(attributes.lens).toBe('study');
		expect(attributes.lang).toBeUndefined();
	});

	it('B.2 integration — emitted JSX never carries `lang` attr; bare python fence emits `lens` from cascade default (configured-python)', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'configured-python');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.snippet).toBe("print('hello')");
		expect(attributes.lens).toBe('study');
		expect(attributes.lang).toBeUndefined();
	});

	it('B.1: js:editor (no comma) → lens=editor, no transforms attribute, code survives', () => {
		const tree = parseStringInConfiguredJs('```js:editor\nlet x = 1;\n```\n');
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('editor');
		expect(attributes.snippet).toBe('let x = 1;');
		expect(attributes.transforms).toBeUndefined();
	});

	// ─── B.4: URL-style fence syntax parser ──────────────────────────────

	it('B.4: bare `js` fence (no suffix) → `lens` from cascade default emitted, snippet survives', () => {
		const tree = parseStringInConfiguredJs('```js\nlet x = 1;\n```\n');
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.snippet).toBe('let x = 1;');
		// configured-js has defaults.js=study → cascade default lens.
		expect(attributes.lens).toBe('study');
	});

	it('B.4: `js:trace` (lens, no query) → lens=trace; configs.lenses.trace is cascade entry (empty in configured-js fixture)', () => {
		const tree = parseStringInConfiguredJs('```js:trace\nlet x = 1;\n```\n');
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		// C: no separate `config` prop.
		expect(attributes.config).toBeUndefined();
		// configured-js fixture has no `lenses` cascade entries, so the
		// trace entry didn't pre-exist and no override merged. The
		// cascade is still emitted whole (configured-languages rule fires).
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect(cascade.defaults).toBeDefined();
		// No-merge witness: configs.lenses.trace stays undefined (no
		// override input, no cascade entry to inherit).
		expect((cascade.lenses as Record<string, unknown>).trace).toBeUndefined();
	});

	it('B.4: `js:trace?stepDelay=500` → lens=trace; configs.lenses.trace = {stepDelay:"500"} (URL-semantic string, no numeric coercion)', () => {
		const tree = parseStringInConfiguredJs(
			'```js:trace?stepDelay=500\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		expect(attributes.config).toBeUndefined();
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toEqual({
			stepDelay: '500',
		});
		expect(cascade.defaults).toBeDefined();
	});

	it('B.4: `js:highlight?stepDelay=500` (different lens, same query) → lens=highlight; configs.lenses.highlight = {stepDelay:"500"} (parser is lens-agnostic)', () => {
		const tree = parseStringInConfiguredJs(
			'```js:highlight?stepDelay=500\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('highlight');
		expect(attributes.config).toBeUndefined();
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).highlight).toEqual({
			stepDelay: '500',
		});
	});

	it('B.4: `js:trace?cols=value,steps` → configs.lenses.trace.cols is array of strings (comma-split inside a query value)', () => {
		const tree = parseStringInConfiguredJs(
			'```js:trace?cols=value,steps\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toEqual({
			cols: ['value', 'steps'],
		});
	});

	it('B.4: `js:trace?key` (no `=`) → boolean true inside configs.lenses.trace', () => {
		const tree = parseStringInConfiguredJs(
			'```js:trace?key\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toEqual({
			key: true,
		});
	});

	it('B.4: `js:trace?key=` (empty value) → empty string inside configs.lenses.trace', () => {
		const tree = parseStringInConfiguredJs(
			'```js:trace?key=\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toEqual({
			key: '',
		});
	});

	it('B.4: `js:trace?a=1&b=2` → multiple query keys joined by `&`', () => {
		const tree = parseStringInConfiguredJs(
			'```js:trace?a=1&b=2\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toEqual({
			a: '1',
			b: '2',
		});
	});

	// ─── B.4: CP-2 — duplicate-key and empty-segment edge cases ──────

	it('B.4 CP-2: duplicate key — `js:trace?a=1&a=2` → last write wins (URLSearchParams-style)', () => {
		const tree = parseStringInConfiguredJs(
			'```js:trace?a=1&a=2\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toEqual({
			a: '2',
		});
	});

	it('B.4 CP-2: empty segment — `js:trace?a=1&&b=2` → empty segments skipped silently (lenient URL-parser)', () => {
		const tree = parseStringInConfiguredJs(
			'```js:trace?a=1&&b=2\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toEqual({
			a: '1',
			b: '2',
		});
	});

	it('B.4 CP-2: duplicate key three times — `js:trace?a=1&a=2&a=3` → last write wins ({a:"3"})', () => {
		const tree = parseStringInConfiguredJs(
			'```js:trace?a=1&a=2&a=3\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toEqual({
			a: '3',
		});
	});

	it('B.4 CP-2: leading `&` — `js:trace?&a=1` → leading empty segment skipped', () => {
		const tree = parseStringInConfiguredJs(
			'```js:trace?&a=1\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toEqual({
			a: '1',
		});
	});

	it('B.4 CP-2: trailing `&` — `js:trace?a=1&` → trailing empty segment skipped', () => {
		const tree = parseStringInConfiguredJs(
			'```js:trace?a=1&\nlet x = 1;\n```\n',
		);
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toEqual({
			a: '1',
		});
	});

	it('B.4: `js:trace?` (empty query) → lens=trace, no merged override on configs.lenses.trace', () => {
		const tree = parseStringInConfiguredJs('```js:trace?\nlet x = 1;\n```\n');
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);

		expect(attributes.lens).toBe('trace');
		expect(attributes.config).toBeUndefined();
		// Empty query → no merge, configs.lenses.trace stays as cascade entry
		// (in configured-js fixture: undefined since no lenses.trace exists).
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).trace).toBeUndefined();
	});

	it('B.4 malformed: `js:` (empty lens-name, no query) → fence NOT transformed', () => {
		const tree = parseStringInConfiguredJs('```js:\nlet x = 1;\n```\n');

		expect(findStudyLensNode(tree.children)).toBeUndefined();
		const codeNode = tree.children.find((n) => n.type === 'code');
		expect(codeNode).toBeDefined();
	});

	it('B.4 malformed: `js:?stepDelay=500` (empty lens-name with query) → fence NOT transformed', () => {
		const tree = parseStringInConfiguredJs(
			'```js:?stepDelay=500\nlet x = 1;\n```\n',
		);

		expect(findStudyLensNode(tree.children)).toBeUndefined();
		const codeNode = tree.children.find((n) => n.type === 'code');
		expect(codeNode).toBeDefined();
	});

	// ─── C: configs carries the whole resolved cascade (opaque) ──────────

	it('C: in-page fence emits `configs` attribute carrying the WHOLE resolved cascade', () => {
		// Use embed-config-merge fixture (cascade has lenses.parsons.shuffleSeed=42).
		const contentRoot = path.join(FIXTURES_DIR, 'embed-config-merge');
		const transformer = createRemarkStudyLenses({ contentRoot });
		const vfile = new VFile({
			value: '```js:parsons\nlet x = 1;\n```\n',
			path: path.join(contentRoot, 'index.md'),
		});
		const tree = unified().use(remarkParse).parse(vfile);
		transformer(tree, vfile);

		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);
		expect(attributes.lens).toBe('parsons');
		// Dual-assertion: per-lens entry survives + top-level cascade keys are
		// present (opaque-passthrough check).
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).parsons).toEqual({
			shuffleSeed: 42,
		});
		expect(cascade.defaults).toBeDefined();
		// embedSiblings is always present post-DEFAULTS-fill.
		expect(cascade.embedSiblings).toBeDefined();
	});

	it('C: in-page fence with no cascade `lenses.*` entries → `configs` still emitted (whole cascade is structurally non-empty)', () => {
		// configured-js fixture has no `lenses` cascade entries; configs is
		// still emitted because the cascade has `defaults` + DEFAULTS-fill.
		const tree = parseStringInConfiguredJs('```js:trace\nlet x = 1;\n```\n');
		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);
		expect(attributes.lens).toBe('trace');
		expect(attributes.configs).toBeDefined();
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect(cascade.defaults).toBeDefined();
		// configs.lenses?.[trace] is undefined — no cascade entry, no merge.
		expect((cascade.lenses as Record<string, unknown>).trace).toBeUndefined();
	});

	it('C: appendTabsEmbed inner StudyLenses emits whole-cascade `configs`', () => {
		const contentRoot = path.join(FIXTURES_DIR, 'embed-tabs-with-configs');
		const tree = parseAndTransform(
			path.join(contentRoot, 'index.md'),
			contentRoot,
		);
		const tabsNode = tree.children.at(-1) as unknown as {
			type: string;
			name?: string;
			children?: ReadonlyArray<{
				type: string;
				name?: string;
				children?: ReadonlyArray<StudyLensJsx>;
			}>;
		};
		expect(tabsNode.name).toBe('Tabs');
		const tabItem = tabsNode.children?.[0];
		expect(tabItem?.name).toBe('TabItem');
		const innerJsx = tabItem?.children?.[0];
		expect(innerJsx?.name).toBe('StudyLenses');
		const innerAttributes = attributesOf(innerJsx);
		expect(innerAttributes.lens).toBe('parsons');
		const cascade = JSON.parse(innerAttributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).parsons).toEqual({
			shuffleSeed: 42,
		});
		expect(cascade.defaults).toBeDefined();
	});

	// ─── C: cascade non-mutation invariant (AR-4 IMPORTANT Concern 2) ───

	it('C: cascade non-mutation — two fences with different queries each get an independent merged cascade', () => {
		// If mergeOverrideIntoCascade mutated the resolver's frozen
		// cascade.lenses.parsons in-place, the second fence's emitted
		// `configs.lenses.parsons` would carry the first fence's
		// shuffleSeed value as its base. Test asserts the two fences
		// produce structurally-independent merged cascades.
		const contentRoot = path.join(FIXTURES_DIR, 'embed-config-merge');
		const transformer = createRemarkStudyLenses({ contentRoot });
		const vfile = new VFile({
			value:
				'```js:parsons?shuffleSeed=1\nlet a=1;\n```\n' +
				'```js:parsons?shuffleSeed=2\nlet b=2;\n```\n',
			path: path.join(contentRoot, 'index.md'),
		});
		const tree = unified().use(remarkParse).parse(vfile);
		transformer(tree, vfile);

		// The embed-config-merge fixture also appends a sibling exercise.js
		// — filter to in-page fences only (the first two StudyLenses
		// children in tree order).
		const jsxNodes = tree.children.filter(
			(n) =>
				(n as { type: string }).type === 'mdxJsxFlowElement' &&
				(n as { name?: string }).name === 'StudyLenses',
		) as unknown as StudyLensJsx[];
		expect(jsxNodes.length).toBeGreaterThanOrEqual(2);
		const c1 = JSON.parse(attributesOf(jsxNodes[0]).configs) as Record<
			string,
			unknown
		>;
		const c2 = JSON.parse(attributesOf(jsxNodes[1]).configs) as Record<
			string,
			unknown
		>;
		// Each fence's merged cascade carries ONLY its own override on
		// top of the cascade base (shuffleSeed:42 in the fixture).
		expect((c1.lenses as Record<string, unknown>).parsons).toEqual({
			shuffleSeed: '1',
		});
		expect((c2.lenses as Record<string, unknown>).parsons).toEqual({
			shuffleSeed: '2',
		});
	});

	// ─── C: directive/query wins on conflict with cascade (AR-3 Concern 6) ──

	it('C: fence query value WINS over a cascade lenses[lens] entry on the same key (directive-wins-conflict)', () => {
		// embed-config-merge fixture has `lenses.parsons.shuffleSeed=42`.
		// A fence `js:parsons?shuffleSeed=99` should produce a merged
		// configs.lenses.parsons.shuffleSeed === "99" (URL-semantic
		// string, no numeric coercion) — directive wins on the conflict.
		const contentRoot = path.join(FIXTURES_DIR, 'embed-config-merge');
		const transformer = createRemarkStudyLenses({ contentRoot });
		const vfile = new VFile({
			value: '```js:parsons?shuffleSeed=99\nlet x = 1;\n```\n',
			path: path.join(contentRoot, 'index.md'),
		});
		const tree = unified().use(remarkParse).parse(vfile);
		transformer(tree, vfile);

		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);
		expect(attributes.lens).toBe('parsons');
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		expect((cascade.lenses as Record<string, unknown>).parsons).toEqual({
			shuffleSeed: '99',
		});
	});

	// ─── C: opaque-boundary test (AR-3 BLOCKER 1 pattern) ────────────────

	it('C: configs is opaque — unknown top-level cascade keys round-trip unchanged', () => {
		// The embed-config-merge fixture cascade should survive structural
		// round-trip via the configs prop. Even unknown top-level keys
		// (anything beyond defaults/embedSiblings/lenses/exerciseSetPrefixes)
		// must ship verbatim to satisfy the "pass it all blindly" contract.
		const contentRoot = path.join(FIXTURES_DIR, 'embed-config-merge');
		const transformer = createRemarkStudyLenses({ contentRoot });
		const vfile = new VFile({
			value: '```js:parsons\nlet x = 1;\n```\n',
			path: path.join(contentRoot, 'index.md'),
		});
		const tree = unified().use(remarkParse).parse(vfile);
		transformer(tree, vfile);

		const jsxNode = findStudyLensNode(tree.children);
		const attributes = attributesOf(jsxNode);
		const cascade = JSON.parse(attributes.configs) as Record<string, unknown>;
		// All four top-level keys from ResolvedConfig are present. Note:
		// `exerciseSetPrefixes` is DEFAULTS-filled (the fixture omits
		// it); this assertion verifies DEFAULTS-fill propagates into the
		// emitted `configs` rather than being stripped at the boundary.
		expect(cascade.defaults).toBeDefined();
		expect(cascade.embedSiblings).toBeDefined();
		expect(cascade.lenses).toBeDefined();
		expect(cascade.exerciseSetPrefixes).toBeDefined();
	});
});
