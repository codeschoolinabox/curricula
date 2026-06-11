/**
 * @vitest-environment jsdom
 *
 * Unit tests for the snippet-free autocomplete factory + its keyword list. The
 * load-bearing anti-cheat invariant — the completions are PLAIN keywords, never
 * snippet templates (no `for`/`if`/`function` skeletons that would hand the
 * learner structure) — is pinned here off an `EditorState` / `CompletionContext`
 * (no editor view, no completion popup; the VISUAL popup is browser-gate-only).
 */

import {
	CompletionContext,
	completeFromList,
	type CompletionResult,
} from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import JS_KEYWORDS from './js-keywords.js';
import snippetFreeAutocomplete from './snippet-free-autocomplete.js';

describe('snippetFreeAutocomplete — the snippet-free completion factory', () => {
	it('composes into an EditorState without throwing', () => {
		expect(() =>
			EditorState.create({
				doc: 'const x = 1;',
				extensions: [javascript(), snippetFreeAutocomplete()],
			}),
		).not.toThrow();
	});

	it('offers the structural keywords as spelling help (for / if / function present)', () => {
		for (const kw of ['for', 'if', 'function', 'const', 'let', 'return']) {
			expect(JS_KEYWORDS).toContain(kw);
		}
	});

	it('contains ONLY bare keywords — never snippet templates (the anti-cheat invariant)', () => {
		// A snippet template would carry structure: parens, braces, placeholders,
		// or whitespace (e.g. `for (${}) {}`). Every entry must be a bare word, so
		// `for` completes as the 3-letter word, not a loop skeleton.
		for (const keyword of JS_KEYWORDS) {
			expect(keyword).toMatch(/^[a-z]+$/);
		}
	});

	it('completes a typed prefix as a PLAIN keyword (no snippet `apply`)', () => {
		// Drive the keyword source directly off a CompletionContext: `fo` →
		// `for` as plain text, with no `apply` (which is how a snippet completion
		// would inject a multi-line skeleton).
		const source = completeFromList([...JS_KEYWORDS]);
		const state = EditorState.create({ doc: 'fo' });
		// completeFromList is synchronous — narrow off the CompletionSource union.
		const result = source(
			new CompletionContext(state, 2, true),
		) as CompletionResult | null;
		expect(result).not.toBeNull();
		const forOption = result?.options.find((option) => option.label === 'for');
		expect(forOption).toBeDefined();
		expect(forOption?.apply).toBeUndefined();
	});
});
