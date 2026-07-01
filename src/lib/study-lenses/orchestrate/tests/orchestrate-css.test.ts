import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// Inc 6's stylesheet is visual (jsdom computes no layout), so it is verified at
// the Sandbox checkpoint — NOT by rendering here. The one property that IS
// statically checkable, jsdom-independent, and load-bearing is leak-safety: the
// contract requires EVERY rule scoped under [data-orchestrator-root] so the
// stylesheet cannot bleed into a consumer page or another lens. This test reads
// the CSS as text and pins that invariant (the blanks-lens precedent scopes the
// same way under [data-lens='blanks']).

const css = readFileSync(
	fileURLToPath(new URL('../orchestrate.css', import.meta.url)),
	'utf8',
);

// Flat split on `}`/`{`: sound for the current at-rule-free CSS. If a future
// `@media`/`@supports`/`@keyframes` block is added this mis-splits — but it fails
// SAFE (the at-rule wrapper doesn't start with [data-orchestrator-root], so the
// guard flags it, forcing the author to handle the at-rule deliberately).
function selectorsOf(source: string): readonly string[] {
	const withoutComments = source.replaceAll(/\/\*[\s\S]*?\*\//g, '');
	return withoutComments
		.split('}')
		.map((rule) => (rule.split('{')[0] ?? '').trim())
		.filter((selector) => selector.length > 0)
		.flatMap((selectorList) => selectorList.split(','))
		.map((selector) => selector.trim())
		.filter((selector) => selector.length > 0);
}

describe('orchestrate.css — leak-safety', () => {
	it('declares at least one rule (the file is wired and non-empty)', () => {
		expect(selectorsOf(css).length).toBeGreaterThan(0);
	});

	it('scopes EVERY selector under [data-orchestrator-root] (no global / unscoped leak)', () => {
		const unscoped = selectorsOf(css).filter(
			(selector) => !selector.startsWith('[data-orchestrator-root]'),
		);
		expect(unscoped).toEqual([]);
	});
});
