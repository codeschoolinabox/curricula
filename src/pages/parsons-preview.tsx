/**
 * @file Dev preview harness for the `parsons` lens. Will mount the lens's
 * React `Component` DIRECTLY (importing the LensModule + `embody`),
 * bypassing the orchestrator's `LENS_REGISTRY` — `parsons` is not
 * registered until the final increment of the WS4 sprint. This page
 * is the browser eyeball surface for the per-increment sandbox
 * checkpoints (Inc 6a → 6f): paste a snippet, drag lines, indent them,
 * and observe the lens.
 *
 * **How to use** (after `npm run start`):
 *
 * 1. Open `http://localhost:3000/spiralearn/parsons-preview` in a browser
 *    (note the `/spiralearn/` baseUrl).
 * 2. Edit the snippet, drag/indent lines, and watch the lens re-mount as
 *    the redo progresses through increments 6a–6f.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

const SAMPLE =
	'function classify(n) {\n\tif (n > 0) {\n\t\treturn "positive";\n\t}\n\treturn "non-positive";\n}';

export default function ParsonsPreview(): React.JSX.Element {
	const [code, setCode] = React.useState<string>(SAMPLE);

	return (
		<Layout title="parsons preview" description="WS4 parsons lens harness">
			<main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>parsons lens preview (WS4 — redo in progress)</h1>
				<p>
					The parsons lens is being rebuilt faithfully from the legacy
					JSParsons implementation. This page will grow as increments
					6a–6f land: shuffled draggable lines, native HTML5 drag-to-reorder,
					a two-pool layout with distractor lines, indent/outdent controls,
					per-line correctness feedback (correct / wrong-order / wrong-indent
					/ distractor) with an aggregate score, and a show-solution toggle.
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
					data-parsons-preview-placeholder
					style={{
						border: '1px dashed #ccc',
						padding: '1rem',
						color: '#666',
						fontStyle: 'italic',
					}}
				>
					Lens not yet mounted. Awaiting Increment 6a (shuffled lines
					rendered as draggable items in a read-only state).
				</div>
			</main>
		</Layout>
	);
}
