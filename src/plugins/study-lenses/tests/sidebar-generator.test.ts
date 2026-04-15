/**
 * @file Unit tests for the sidebar-items-generator factory (Module H).
 *
 * Uses the `{ resolvedConfig }` branch of `SidebarGeneratorOptions` to
 * keep tests hermetic — no filesystem, no cascade resolver. Tests
 * construct fake sidebar-item trees matching Docusaurus's shape and
 * assert the transform's behavior on category labels.
 */

import { describe, expect, it, vi } from 'vitest';

import DEFAULTS from '../defaults.js';
import createStudySidebarGenerator from '../sidebar-generator.js';

import type { ResolvedConfig } from '../types.js';

function configWith(prefixes: ReadonlyArray<string>): ResolvedConfig {
	return { ...DEFAULTS, exerciseSetPrefixes: prefixes };
}

/**
 * Synthetic sidebar "category" item — mirrors the shape the default
 * generator would have produced. Minimal — Docusaurus's actual
 * SidebarItem types carry more fields, but the transform only reads
 * `type`, `label`, and `items`.
 */
function cat(label: string, items: ReadonlyArray<unknown> = []): unknown {
	return { type: 'category', label, items };
}

function doc(id: string, label: string): unknown {
	return { type: 'doc', id, label };
}

async function runGenerator(
	config: ResolvedConfig,
	items: ReadonlyArray<unknown>,
): Promise<ReadonlyArray<unknown>> {
	const generator = createStudySidebarGenerator({ resolvedConfig: config });
	return generator({
		defaultSidebarItemsGenerator: async () => items,
	});
}

describe('createStudySidebarGenerator', () => {
	it('empty exerciseSetPrefixes → default output passes through unchanged', async () => {
		const items = [cat('sl-01-foo')];
		const result = await runGenerator(configWith([]), items);
		expect(result).toEqual(items);
	});

	it('category whose label does NOT match any prefix → left unchanged', async () => {
		const items = [cat('0-what-is-programming'), cat('plain-label')];
		const result = await runGenerator(configWith(['sl-']), items);
		expect((result[0] as { label: string }).label).toBe('0-what-is-programming');
		expect((result[1] as { label: string }).label).toBe('plain-label');
	});

	it('prefix + numeric ordering + kebab → Title Case', async () => {
		const items = [cat('sl-01-while-loops')];
		const result = await runGenerator(configWith(['sl-']), items);
		expect((result[0] as { label: string }).label).toBe('While Loops');
	});

	it('prefix without numeric ordering → Title Case', async () => {
		const items = [cat('sl-single-file')];
		const result = await runGenerator(configWith(['sl-']), items);
		expect((result[0] as { label: string }).label).toBe('Single File');
	});

	it('sibling categories, some matching, others not → selective transform', async () => {
		const items = [cat('sl-01-foo'), cat('plain-bar')];
		const result = await runGenerator(configWith(['sl-']), items);
		expect((result[0] as { label: string }).label).toBe('Foo');
		expect((result[1] as { label: string }).label).toBe('plain-bar');
	});

	it('nested: matching child inside non-matching parent → child transforms, parent untouched', async () => {
		const items = [
			cat('chapter-one', [cat('sl-01-while-loops'), doc('note', 'Note')]),
		];
		const result = await runGenerator(configWith(['sl-']), items);
		const parent = result[0] as { label: string; items: Array<unknown> };
		expect(parent.label).toBe('chapter-one');
		expect((parent.items[0] as { label: string }).label).toBe('While Loops');
		expect((parent.items[1] as { label: string }).label).toBe('Note');
	});

	it('three-digit numeric ordering is stripped', async () => {
		const items = [cat('sl-100-foo')];
		const result = await runGenerator(configWith(['sl-']), items);
		expect((result[0] as { label: string }).label).toBe('Foo');
	});

	it('multiple prefixes → any matches respectively', async () => {
		const items = [cat('sl-01-foo'), cat('es-02-bar')];
		const result = await runGenerator(configWith(['sl-', 'es-']), items);
		expect((result[0] as { label: string }).label).toBe('Foo');
		expect((result[1] as { label: string }).label).toBe('Bar');
	});

	it('literal string-prefix semantics: "s-" does NOT match "sl-01-foo"', async () => {
		const items = [cat('sl-01-foo')];
		const result = await runGenerator(configWith(['s-']), items);
		expect((result[0] as { label: string }).label).toBe('sl-01-foo');
	});

	it('doc-item labels inside a matched category are not transformed by this module', async () => {
		const items = [cat('sl-01-while-loops', [doc('lesson', 'The Lesson')])];
		const result = await runGenerator(configWith(['sl-']), items);
		const transformed = result[0] as { label: string; items: Array<unknown> };
		expect(transformed.label).toBe('While Loops');
		expect((transformed.items[0] as { label: string }).label).toBe(
			'The Lesson',
		);
	});

	it('explicitly-set category label (_category_.json / frontmatter) is idempotent', async () => {
		const items = [cat('While Loops: Overview')];
		const result = await runGenerator(configWith(['sl-']), items);
		expect((result[0] as { label: string }).label).toBe(
			'While Loops: Overview',
		);
	});

	it('empty residue after strip → falls back to original label + warns once', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const items = [cat('sl-'), cat('sl-01-')];
		const result = await runGenerator(configWith(['sl-']), items);

		expect((result[0] as { label: string }).label).toBe('sl-');
		expect((result[1] as { label: string }).label).toBe('sl-01-');
		expect(warnSpy).toHaveBeenCalledTimes(2);

		warnSpy.mockRestore();
	});

	it('overlapping prefixes: first-match-wins (sl- consumed before sl-0)', async () => {
		const items = [cat('sl-01-foo')];
		const result = await runGenerator(configWith(['sl-', 'sl-0']), items);
		expect((result[0] as { label: string }).label).toBe('Foo');
	});
});
