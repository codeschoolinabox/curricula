/**
 * @file Dev preview harness for the `quiz` lens. Mounts the lens's React
 * `Component` directly (importing the `LensModule` + `embody`) rather than
 * going through the orchestrator's `LENS_REGISTRY` — the lens IS registered
 * (consumers reach it via the L1 picker too), but this page deliberately
 * bypasses the registry so the lens surface is isolated from
 * picker/orchestrator state for sandbox observation.
 *
 * Open `http://localhost:3000/spiralearn/quiz-preview` in a browser after
 * `npm run start`. Edit the snippet textarea, or load a sample.
 *
 * Slice A inc 1: the code renders read-only and un-colorized (black-on-white,
 * not editable); a non-parsing snippet shows the fallback notice. Clicking a
 * token (anchors), the question panel, and graded verdicts arrive in later
 * increments.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a page, not
 * a unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import embody from '@site/src/lib/embody/index.js';
import quizLens from '@site/src/lib/study-lenses--deprecated-architecture/lenses/quiz/index.jsx';

const SAMPLE =
	'let count = 0;\nfunction inc(n) {\n\treturn n + 1;\n}\ncount = inc(count);';

// A deliberately unparseable snippet — exercises the parse-fail fallback path.
const BROKEN = 'function (';

export default function QuizPreview(): React.JSX.Element {
	const [code, setCode] = React.useState<string>(SAMPLE);

	return (
		<Layout title="quiz preview" description="syntax-element quiz lens harness">
			<main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>quiz lens preview</h1>
				<p>
					Dev harness for the quiz lens. The textarea below feeds an embodiment
					into the lens; the wrapper renders the source read-only and
					un-colorized (black-on-white, not editable). A non-parsing snippet
					shows the fallback notice. Clickable anchors, the question panel, and
					graded verdicts arrive in later increments.
				</p>

				<div style={{ marginBottom: 8 }}>
					<button
						type="button"
						onClick={function loadSample() {
							setCode(SAMPLE);
						}}
						style={{ marginRight: 8 }}
					>
						Load sample snippet
					</button>
					<button
						type="button"
						onClick={function loadBroken() {
							setCode(BROKEN);
						}}
					>
						Load unparseable snippet
					</button>
				</div>

				<label style={{ display: 'block', marginBottom: 8 }}>
					Snippet:
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
					data-quiz-preview-mount
					style={{ border: '1px solid #ccc', padding: '1rem' }}
				>
					<quizLens.Component
						key={code}
						embodiment={embody(code)}
						config={quizLens.config()}
					/>
				</div>
			</main>
		</Layout>
	);
}
