/**
 * @file Dev preview harness for the `parsons` lens. Mounts the lens's React
 * `Component` DIRECTLY (importing the LensModule + `embody`), bypassing the
 * orchestrator's `LENS_REGISTRY` — `parsons` is not registered until the final
 * increment of the WS4 sprint. This page is the browser eyeball surface for the
 * per-increment sandbox checkpoints (Inc 7a → 7f): paste a snippet, drag lines,
 * indent them, and observe the lens.
 *
 * **How to use** (after `npm run start`):
 *
 * 1. Open `http://localhost:3000/spiralearn/parsons-preview` in a browser
 *    (note the `/spiralearn/` baseUrl).
 * 2. Edit the snippet, drag/indent lines, and watch the lens re-mount as the
 *    redo progresses through increments 7a–7f.
 *
 * Inc 7a: wrapper mounts and renders the shuffled snippet lines as draggable
 * `<li>` in a read-only state (no drop handlers yet — native HTML5 DnD lands in
 * 7b). Lines ending with `// distractor` are pulled out as distractors and mixed
 * into the pool. `key={code}` forces a fresh parse (and re-shuffle) per edit.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a page, not a
 * unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import embody from '@site/src/lib/just-enough/javascript/embody/index.js';
import parsonsLens from '@site/src/lib/just-enough/javascript/lenses/parsons/index.js';

const SAMPLE =
	'function classify(n) {\n\tif (n > 0) {\n\t\treturn "positive";\n\t}\n\treturn "non-positive";\n}\nconsole.log("unused"); // distractor';

export default function ParsonsPreview(): React.JSX.Element {
	const [code, setCode] = React.useState<string>(SAMPLE);

	return (
		<Layout title="parsons preview" description="WS4 parsons lens harness">
			<main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>parsons lens preview (WS4 — Inc 7a)</h1>
				<p>
					Inc 7a: the wrapper mounts and renders the snippet&apos;s lines{' '}
					<strong>shuffled</strong> into a read-only pool of draggable items
					(plus any <code>// distractor</code> lines). Dragging is not wired yet
					— native HTML5 drag-and-drop lands in 7b, the two-column solution
					layout in 7c, indent controls in 7d, Check + per-line feedback + score
					in 7e, and the show-solution toggle in 7f.
				</p>

				<label style={{ display: 'block', marginBottom: 8 }}>
					Snippet:
					<textarea
						value={code}
						onChange={function onCodeChange(event) {
							setCode(event.target.value);
						}}
						rows={8}
						style={{ width: '100%', fontFamily: 'monospace' }}
					/>
				</label>

				<div
					data-parsons-preview-mount
					style={{ border: '1px solid #ccc', padding: '1rem' }}
				>
					<parsonsLens.Component
						key={code}
						embodiment={embody(code)}
						config={parsonsLens.config()}
					/>
				</div>
			</main>
		</Layout>
	);
}
