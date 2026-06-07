/**
 * @file Dev preview harness for the `writeme` lens. Mounts the lens's React
 * `Component` DIRECTLY (importing the LensModule + `embody`), bypassing the
 * orchestrator's `LENS_REGISTRY` — `writeme` is not registered until the final
 * increment of the WS4 sprint. This page is the browser eyeball surface for the
 * per-increment sandbox checkpoints (Inc 6a → 6f): edit the snippet, type to
 * reconstruct it, and observe the lens.
 *
 * **How to use** (after `npm run start`):
 *
 * 1. Open `http://localhost:3000/spiralearn/writeme-preview` in a browser
 *    (note the `/spiralearn/` baseUrl).
 * 2. Edit the snippet (the "solution"), type into the editor to reconstruct it,
 *    and watch the lens re-mount as the redo progresses through increments 6a–6f.
 *
 * Inc 6a: the wrapper mounts a paste-blocked CodeMirror editor seeded from the
 * comment skeleton (Keep Comments default on — comments stay, code lines are
 * blanked). Try pasting — it should be blocked. `key={code}` forces a fresh
 * mount (and re-seed) per snippet edit. The view toggle + read view (6b),
 * keep-comments + reset (6c), diff highlighting (6d), hints (6e), and the honest
 * Check + instructions (6f) land in later increments.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a page, not a
 * unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import embody from '@site/src/lib/just-enough/javascript/embody/index.js';
import writemeLens from '@site/src/lib/just-enough/javascript/lenses/writeme/index.js';

const SAMPLE =
	'function classify(n) {\n\t// positive, negative, or zero\n\tif (n > 0) {\n\t\treturn "positive";\n\t}\n\treturn "non-positive";\n}';

export default function WritemePreview(): React.JSX.Element {
	const [code, setCode] = React.useState<string>(SAMPLE);

	return (
		<Layout title="writeme preview" description="WS4 writeme lens harness">
			<main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>writeme lens preview (WS4 — Inc 6a)</h1>
				<p>
					Inc 6a: the wrapper mounts a <strong>paste-blocked</strong> CodeMirror
					editor seeded from the <strong>comment skeleton</strong> (Keep
					Comments default on — comments stay, code lines are blanked). Type to
					reconstruct the code; try pasting — it should be blocked. The view
					toggle + read view (6b), keep-comments + reset (6c), diff highlighting
					(6d), hints (6e), and the honest Check + instructions (6f) land in
					later increments.
				</p>

				<label style={{ display: 'block', marginBottom: 8 }}>
					Snippet (the solution):
					<textarea
						value={code}
						onChange={function onCodeChange(event) {
							setCode(event.target.value);
						}}
						rows={10}
						style={{ width: '100%', fontFamily: 'monospace' }}
					/>
				</label>

				<div
					data-writeme-preview-mount
					style={{ border: '1px solid #ccc', padding: '1rem' }}
				>
					<writemeLens.Component
						key={code}
						embodiment={embody(code)}
						config={writemeLens.config()}
					/>
				</div>
			</main>
		</Layout>
	);
}
