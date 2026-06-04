/**
 * @file Dev preview harness for the `blanks` lens. Mounts the lens's
 * React `Component` DIRECTLY (importing the LensModule + `embody`),
 * bypassing the orchestrator's `LENS_REGISTRY` — `blanks` is not
 * registered until Inc 7 of the WS4 sprint. This page is the browser
 * eyeball surface for the per-increment sandbox checkpoints (Inc
 * 6a → 6j): type a snippet, toggle controls, and observe the lens.
 *
 * **How to use** (after `npm run start`):
 *
 * 1. Open `http://localhost:3000/spiralearn/blanks-preview` in a browser.
 * 2. Edit the snippet, toggle the controls (as they land per
 *    increment), and watch the lens re-mount as the redo progresses
 *    through increments 6a–6j.
 *
 * Inc 6a: wrapper mounts CodeMirror in read-only blankenated mode.
 * Difficulty hard-coded to 100 (every eligible token blanked) so the
 * `__` placeholders are maximally visible at the checkpoint.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import embody from '@site/src/lib/just-enough/javascript/embody/index.js';
import blanksLens from '@site/src/lib/just-enough/javascript/lenses/blanks/index.js';

const SAMPLE =
	'function classify(n) {\n\tif (n > 0) {\n\t\treturn "positive";\n\t}\n\treturn "non-positive";\n}';

export default function BlanksPreview(): React.JSX.Element {
	const [code, setCode] = React.useState<string>(SAMPLE);

	return (
		<Layout title="blanks preview" description="WS4 blanks lens harness">
			<main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>blanks lens preview (WS4 — Inc 6a)</h1>
				<p>
					Inc 6a: wrapper mounts CodeMirror in read-only blankenated mode.
					Difficulty is set to 100 so every eligible token is blanked
					(maximum-visible <code>__</code> for the checkpoint). Subsequent
					increments add the view-mode toggle (6b), editable mode (6c),
					per-blank correctness (6d), difficulty slider (6e), content-type
					checkboxes (6f), editor header (6g), hints panel (6h), URL config
					(6i), and the Ask Me button backed by <code>socratizing/</code> (6j).
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
					data-blanks-preview-mount
					style={{ border: '1px solid #ccc', padding: '1rem' }}
				>
					<blanksLens.Component
						key={code}
						embodiment={embody(code)}
						config={blanksLens.config({ difficulty: 100 })}
					/>
				</div>
			</main>
		</Layout>
	);
}
