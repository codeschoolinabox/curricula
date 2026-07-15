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

import embody from '@site/src/lib/embody/index.js';
import parsonsLens from '@site/src/lib/study-lenses--deprecated-architecture/lenses/parsons/index.jsx';

const SAMPLE =
	'/* Read each line and think about the order before you drag. */\nfunction classify(n) {\n\tif (n > 0) {\n\t\treturn "positive";\n\t}\n\treturn "non-positive";\n}\nconsole.log("unused"); // distractor\n/* parsons-collapse: Big picture\nGuard the positive case first, then fall through to the rest. */';

export default function ParsonsPreview(): React.JSX.Element {
	const [code, setCode] = React.useState<string>(SAMPLE);

	return (
		<Layout title="parsons preview" description="WS4 parsons lens harness">
			<main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>parsons lens preview (WS4 — Inc 10 + 11)</h1>
				<p>
					A full Parsons exercise: the snippet is parsed into{' '}
					<strong>shuffled</strong> draggable lines (plus any{' '}
					<code>// distractor</code> lines). Drag lines from the pool into the
					solution column, reorder them, indent/outdent, then{' '}
					<strong>Check</strong> for per-line feedback + a score;{' '}
					<strong>Reset</strong> re-shuffles and <strong>Show solution</strong>{' '}
					reveals the model order. Feedback uses a{' '}
					<strong>colour-blind-safe palette</strong> (blue = right place,
					vermilion = wrong, with solid/dashed/dotted borders so it never relies
					on hue).
				</p>
				<p>
					<strong>Inc 10</strong> — the info panel above the board: a
					collapsible <strong>feedback legend</strong>, a collapsed{' '}
					<strong>distractor-count</strong> hint (the number stays hidden until
					you expand it), and educator <strong>hint blocks</strong> from{' '}
					<code>{'/* … */'}</code> comments (each a collapsible <em>Hint</em> by
					default; <code>parsons-collapse: Label</code> customizes the label).{' '}
					<strong>Inc 11</strong> — <strong>Review attempts</strong> opens a
					modal logging every Check (score, pass/fail, a frozen snapshot); it
					persists across Reset and closes on Escape.
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
