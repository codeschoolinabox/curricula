/**
 * @file L1 sandbox harness for the toolbar lens-picker.
 *
 * Open `http://localhost:3000/spiralearn/l1-picker` after `npm run start`.
 *
 * **What to verify at each L1 increment:**
 *
 * - **L1.2** (this commit): the toolbar shell — a `<nav
 *   data-orchestrator-toolbar>` element — is rendered above the active
 *   surface in both the editor-mode `<StudyLenses>` instance below and
 *   the lens-mode one. The shell is currently empty; subsequent
 *   increments add the picker dropdown and the conditional edit button.
 * - **L1.4**: the picker neutral state shows a sentinel-first option
 *   (`— select a lens —`) in editor mode; selecting a registered lens
 *   transitions the orchestrator to lens mode.
 * - **L1.6 / L1.7**: picker selections dispatch `mode-changed` then
 *   `lens-switched(source: 'picker')` on the internal bus.
 * - **L1.9 / L1.10**: an edit button appears only in lens mode; clicking
 *   it returns to editor mode.
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
			description="L1 sandbox — toolbar lens-picker visible in both editor and lens modes"
		>
			<main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>L1 picker sandbox</h1>
				<p>
					The toolbar (currently just an empty <code>&lt;nav&gt;</code> shell at
					L1.2) should appear above the active surface in both panels below.
					Subsequent L1 increments will add the picker dropdown and the
					conditional edit button.
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
