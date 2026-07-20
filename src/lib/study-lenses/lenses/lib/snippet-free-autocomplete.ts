// cspell:ignore Lezer keymap
/**
 * @file Snippet-free autocomplete for recall lenses. Returns a CodeMirror
 * extension that offers JavaScript keywords plus identifiers ALREADY in the
 * buffer (in-scope locals from the Lezer tree), with **no snippet templates**
 * (no `for` / `if` / `function` skeletons — those would hand the learner
 * structure rather than spelling help).
 *
 * Mechanism: `autocompletion({ override: [...] })` REPLACES the language-data
 * completion sources — which is exactly where `@codemirror/lang-javascript`
 * registers its snippet completions — so the snippet templates are never
 * consulted. We supply two override sources: `localCompletionSource` (in-buffer
 * locals from the syntax tree) and a hand-rolled `completeFromList` of bare
 * keyword strings (plain text, NOT `snippetCompletion(...)` skeletons).
 *
 * It cannot suggest the solution's unrevealed identifiers (they are not in the
 * buffer), so it leaks no answer — a syntax-production scaffold, not a content
 * hint.
 *
 * Lens-agnostic (a zero-arg factory returning an `Extension`) so other recall
 * lenses (e.g. `blanks`) can adopt the same toggle. The host editor must have a
 * JavaScript language extension active (`localCompletionSource` reads the syntax
 * tree) and `completionKeymap` in its keymap (to navigate / accept completions).
 */
import { autocompletion, completeFromList } from '@codemirror/autocomplete';
import { localCompletionSource } from '@codemirror/lang-javascript';
import type { Extension } from '@codemirror/state';

import JS_KEYWORDS from './js-keywords.js';

export default function snippetFreeAutocomplete(): Extension {
	return autocompletion({
		override: [localCompletionSource, completeFromList([...JS_KEYWORDS])],
	});
}
