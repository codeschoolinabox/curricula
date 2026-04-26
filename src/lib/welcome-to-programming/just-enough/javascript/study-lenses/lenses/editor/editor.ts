/**
 * @file Increment-8 stub of the `editor` lens module.
 *
 * The "editor" lens is the default landing lens for `js:editor` fences
 * and the fallback target for `validatePipeline` when an unknown lens
 * name is requested. In the finished system this file owns the
 * CodeMirror-backed code editor; for Increment 8 it ships a placeholder
 * that renders the snippet verbatim inside a
 * `<pre data-lens="editor-stub">` so the orchestrator scaffolding has a
 * concrete `LensModule` to wire and the dev sandbox has something
 * visible to verify.
 *
 * @remarks Replace the body of `lens` with the real CodeMirror mount in
 * a later increment (15+). Keep the file path, the default-export
 * shape, and the `LensModule` contract stable so the orchestrator does
 * not need to change when the real editor lands.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type {
	LensConfig,
	LensModule,
	LensMount,
	Recommendation,
} from '../../types.js';

/**
 * Mount the stub editor into a fresh `<pre>` element. The element
 * carries `data-lens="editor-stub"` so tests and the dev sandbox can
 * assert this is the placeholder, not the real editor.
 *
 * @remarks Synchronous on purpose — the real editor lens will return a
 * `Promise<LensMount>` once CodeMirror is wired. The orchestrator
 * awaits either form, so changing the return shape later is a contained
 * change inside this file.
 */
function lens(code: string): LensMount {
	const element = document.createElement('pre');
	element.dataset.lens = 'editor-stub';
	element.textContent = code;
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
	return freezeInPlace({ ...overrides });
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
