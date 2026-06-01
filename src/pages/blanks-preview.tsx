/**
 * @file Dev preview harness for the `blanks` lens. Mounts the lens's
 * React `Component` DIRECTLY (importing the LensModule + `embody`),
 * bypassing the orchestrator's `LENS_REGISTRY` — `blanks` is not
 * registered until the final increment of the WS4 sprint. This page
 * is the browser eyeball surface for the per-increment sandbox
 * checkpoints (Inc 6a → 6j): type a snippet, toggle controls, and
 * observe the lens.
 *
 * **How to use** (after `npm run start`):
 *
 * 1. Open `http://localhost:3000/blanks-preview` in a browser.
 * 2. Edit the snippet, toggle the controls, and watch the lens
 *    re-mount as the redo progresses through increments 6a–6j.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

const SAMPLE = 'function classify(n) {\n\tif (n > 0) {\n\t\treturn "positive";\n\t}\n\treturn "non-positive";\n}';

export default function BlanksPreview(): React.JSX.Element {
	const [code, setCode] = React.useState<string>(SAMPLE);

	return (
		<Layout title="blanks preview" description="WS4 blanks lens harness">
			<main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>blanks lens preview (WS4 — redo in progress)</h1>
				<p>
					The blanks lens is being rebuilt faithfully from the legacy
					implementation. This page will grow as increments 6a–6j land:
					CodeMirror with <code>__</code> placeholders, view-mode toggle,
					difficulty slider, content-type checkboxes, correctness wiring,
					editor header, hints panel, URL config, and the Ask Me button
					backed by <code>socratizing/</code>.
				</p>

				<label style={{ display: 'block', marginBottom: 8 }}>
					Snippet:
					<textarea
						value={code}
						onChange={function onCodeChange(event) {
							setCode(event.target.value);
						}}
						rows={6}
						style={{ width: '100%', fontFamily: 'monospace' }}
					/>
				</label>

				<div
					data-blanks-preview-placeholder
					style={{
						border: '1px dashed #ccc',
						padding: '1rem',
						color: '#666',
						fontStyle: 'italic',
					}}
				>
					Lens not yet mounted. Awaiting Increment 6a (CodeMirror in
					read-only blankenated mode).
				</div>
			</main>
		</Layout>
	);
}
