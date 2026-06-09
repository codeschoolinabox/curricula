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
 * A paste-blocked CodeMirror editor seeded from the comment skeleton (Comments
 * default on — comments stay, code lines are blanked), a Write / Read toggle
 * (Read shows the SOLUTION ALONE to study; Write and Read are mutually exclusive
 * — read → remember → type), the four Assist toggles (colorize / suggestions /
 * comments / diff), and the diff PAIR (write: typed-but-wrong lines in red; Read:
 * not-yet-reproduced solution lines in amber). `key={code}` forces a fresh mount
 * (and re-seed) per snippet edit. This is the complete lens — hints, a numeric
 * Check, and instructions were considered and cut (the diff pair is the feedback).
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
				<h1>writeme lens preview (WS4 — Inc 6e-rb-2)</h1>
				<p>
					A <strong>paste-blocked</strong> CodeMirror editor seeded from the{' '}
					<strong>comment skeleton</strong> (Comments default on — comments
					stay, code lines are blanked), a <strong>Write / Read</strong> toggle
					(Read shows the <strong>solution alone</strong> to study; Write and
					Read are mutually exclusive — read → remember → type), and four
					orthogonal <strong>Assist</strong> toggles: Colorize, Suggestions,
					Comments (pristine-gated re-seed + Reset), and <strong>Diff</strong>.
					Diff is now a <strong>pair</strong>: on the <strong>write</strong>{' '}
					editor it highlights each <strong>typed-but-wrong</strong> line in red
					(live; unattempted blanks stay neutral); on the <strong>Read</strong>{' '}
					solution editor it marks in amber every line you have{' '}
					<strong>not yet reproduced</strong> (a study cue — your code is never
					shown). This is the complete lens — hints, a numeric Check, and
					instructions were considered and cut; the diff pair is the feedback.
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
