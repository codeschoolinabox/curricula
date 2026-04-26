/**
 * @file Stub of the `highlight` lens module.
 *
 * The "highlight" lens is the read-only syntax-view counterpart to the
 * editable [`editor`](../editor/) lens. The finished system swaps in
 * Shiki/Prism-driven syntax highlighting; today this file ships a
 * placeholder that renders the snippet verbatim inside a
 * `<pre data-lens="highlight-stub"><code>...</code></pre>` so the
 * orchestrator can switch between two visibly-distinct mounts (the
 * editor textarea vs this read-only pre/code) and verify cache-hit
 * reattach works end-to-end.
 *
 * @remarks Replace the body of `lens` with the real
 * highlighter-backed mount in a later increment (15+). Keep the file
 * path, the default-export shape, and the `LensModule` contract
 * stable so the orchestrator does not need to change when the real
 * highlight lens lands.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type {
	LensConfig,
	LensModule,
	LensMount,
	Recommendation,
} from '../../types.js';

/**
 * Mount the stub highlight view into a fresh `<pre>` element wrapping
 * a `<code>` child. The outer `<pre>` carries
 * `data-lens="highlight-stub"` so tests and the dev sandbox can
 * assert this is the placeholder, not the real highlight lens. The
 * structure is read-only — learners cannot edit the displayed code.
 *
 * @remarks Synchronous on purpose — the real highlight lens may
 * remain synchronous (Prism) or become asynchronous (Shiki, which
 * lazy-loads themes). The orchestrator awaits either form, so
 * changing the return shape later is a contained change inside this
 * file.
 */
function lens(code: string): LensMount {
	const element = document.createElement('pre');
	element.dataset.lens = 'highlight-stub';
	const codeChild = document.createElement('code');
	codeChild.textContent = code;
	element.append(codeChild);
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
 * land in a later increment alongside the real highlight lens.
 */
function recommend(): ReadonlyArray<Recommendation> {
	return freezeInPlace([]);
}

const highlight: LensModule = freezeInPlace({
	name: 'highlight',
	lens,
	config,
	recommend,
});

export default highlight;
