/**
 * @file Stub of the `editor` lens module.
 *
 * The "editor" lens is the default landing lens for `js:editor` fences
 * and the fallback target for `validatePipeline` when an unknown lens
 * name is requested. In the finished system this file owns the
 * CodeMirror-backed code editor; today it ships a placeholder that
 * renders the snippet verbatim inside a
 * `<textarea data-lens="editor-stub">` so the orchestrator scaffolding
 * has a concrete `LensModule` to wire and the dev sandbox has an
 * editable surface that contrasts visually with the read-only
 * `<pre><code>` highlight stub.
 *
 * @remarks Replace the body of `lens` with the real CodeMirror mount
 * in a later increment (15+). Keep the file path, the default-export
 * shape, and the `LensModule` contract stable so the orchestrator
 * does not need to change when the real editor lands. The stub does
 * NOT propagate edits — typing in the textarea is visible but does
 * not dispatch `snippet-changed`. That arrives with the real lens.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type {
	LensConfig,
	LensModule,
	LensMount,
	Recommendation,
} from '../../types.js';

/**
 * Mount the stub editor into a fresh `<textarea>` element. The element
 * carries `data-lens="editor-stub"` so tests and the dev sandbox can
 * assert this is the placeholder, not the real editor. The textarea is
 * editable (a learner can type into it); edits are NOT propagated to
 * the orchestrator — that arrives with the real CodeMirror lens.
 *
 * @remarks Synchronous on purpose — the real editor lens will return a
 * `Promise<LensMount>` once CodeMirror is wired. The orchestrator
 * awaits either form, so changing the return shape later is a
 * contained change inside this file.
 *
 * @remarks Both `.value` and `.textContent` are set so consumers
 * reading either property see the snippet. `.value` is the
 * post-mount edit-aware getter; `.textContent` is the text-node
 * child, which doubles as the textarea's default value at form-reset
 * time. They are equivalent only at mount time — once a learner types,
 * `.value` diverges from `.textContent`.
 */
function lens(code: string): LensMount {
	const element = document.createElement('textarea');
	element.dataset.lens = 'editor-stub';
	element.textContent = code;
	element.value = code;
	return freezeInPlace({
		el: element,
		dispose: (): void => undefined,
	});
}

/**
 * Resolve a `LensConfig` for this lens. The stub has no configuration
 * surface — it accepts overrides for forward-compatibility and freezes
 * the result so callers cannot mutate the returned record.
 */
function config(overrides?: Partial<LensConfig>): LensConfig {
	// `Partial<LensConfig>` widens values to `T | undefined`. The spread
	// preserves only own enumerable keys, so any explicit `undefined` from
	// the caller is intentional and round-trips. Cast narrows the type
	// back to the declared `LensConfig` shape without runtime cost.
	return freezeInPlace({ ...overrides }) as LensConfig;
}

/**
 * Recommend Block-Model placements for this lens given a snippet
 * analysis report. The stub returns an empty list — recommendations
 * land in a later increment alongside the real editor.
 */
function recommend(): ReadonlyArray<Recommendation> {
	return freezeInPlace([]);
}

const editor: LensModule = freezeInPlace({
	name: 'editor',
	lens,
	config,
	recommend,
});

export default editor;
