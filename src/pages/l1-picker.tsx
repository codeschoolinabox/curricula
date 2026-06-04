/**
 * @file L1 sandbox harness for the toolbar lens-picker.
 *
 * Open `http://localhost:3000/spiralearn/l1-picker` after `npm run start`.
 *
 * Both panels mount `<StudyLenses>` with the same snippet; the top panel
 * starts in editor mode, the bottom in lens mode (`lens="debug-props"`).
 * Toolbar contents are state-derived in both panels:
 *
 * - **Lens-picker dropdown** — a `<select data-orchestrator-lens-picker>`
 *   carrying a non-selectable sentinel (`— select a lens —`) followed by
 *   one `<option>` per entry in `LENS_REGISTRY`, in registration order.
 *   Selecting a lens transitions the orchestrator to lens mode for that
 *   lens and dispatches `mode-changed` then
 *   `lens-switched(source: 'picker')` on the internal bus.
 * - **Edit-return button** — a `<button data-orchestrator-edit-button>`
 *   labelled "Edit code" that appears only when `state.mode === 'lens'`.
 *   Clicking it returns to editor mode and dispatches
 *   `mode-changed({from: 'lens', to: 'editor'})`; `lens-switched` is NOT
 *   dispatched (no lens is being selected, the active lens is being
 *   unmounted). The internal `applyTransition` call passes
 *   `source: 'edit-button'` for analytics-style attribution, but
 *   `ModeChangedPayload` carries only `{from, to}`, so the source is not
 *   observable on the bus today.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import { StudyLenses } from '@site/src/lib/just-enough/javascript/index.js';

export default function L1Picker(): React.JSX.Element {
	return (
		<Layout
			title="L1 picker"
			description="L1 sandbox — toolbar lens-picker + edit-return button"
		>
			<main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>L1 picker sandbox</h1>
				<p>
					Each panel renders a fully-wired toolbar above its active surface. The
					picker enumerates the registered lenses (sentinel first); the
					edit-return button appears only in lens mode.
				</p>
				<h2>Editor mode (no lens prop)</h2>
				<StudyLenses snippet="OK" />
				<h2>
					Lens mode (<code>lens=&quot;debug-props&quot;</code>)
				</h2>
				<StudyLenses snippet="OK" lens="debug-props" />
			</main>
		</Layout>
	);
}
