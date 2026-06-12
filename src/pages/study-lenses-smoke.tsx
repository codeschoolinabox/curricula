/**
 * @file Sandbox harness for `<StudyLenses>` — the Cycle-1 demo page.
 * Mounts the orchestrator directly (bypassing the Docusaurus plugin) so the
 * live-embodiment chain (buffer → debounced static embody → interpreted
 * gutter diagnostics) can be exercised in a real browser via the dev server.
 *
 * **Demo script** (after `npm run start`, open
 * `http://localhost:3000/study-lenses-smoke`):
 *
 * 1. Type `let x = ;` into the editor (replace the buffer). After the
 *    ~200ms debounce settle, ONE red gutter marker appears on line 1;
 *    hovering it shows a friendly plain-prose explanation — not acorn's
 *    terse parse message duplicated (the interpreted diagnostic supersedes
 *    the structural marker at the same position).
 * 2. Fix the line to `let x = 1;` — the marker clears on the next settle.
 * 3. Click `VALIDATION_FAIL` (or type it as the whole buffer): the canned
 *    scenario embodiment's interpretation appears in the gutter. The
 *    sentinel buttons swap snippets by REMOUNTING via `key={snippet}` —
 *    the orchestrator consumes `snippet` as an initial value only.
 * 4. Type `var x = 1` — lintJej's structural marker appears (teaching-
 *    boundary style) but NO embodiment-derived interpretation. Expected,
 *    not a bug: embody's validating/creation slices are stubbed on real
 *    code, so Cycle 1 interprets tokenize/parse errors + the named
 *    scenarios only.
 * 5. Use a phases-panel station dropdown to open a lens and the edit
 *    button to return — the gutter state survives the round-trip (the
 *    live slot is retained). The panel's columns double as the lifecycle
 *    status display: scenario buttons exercise hiding (VALIDATION_FAIL →
 *    LL stations removed) and barring (FAIL_AT_PARSE → creation +
 *    evaluation barred).
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test. No corresponding `.test.tsx` file.
 */

import Layout from '@theme/Layout';
import React from 'react';

import { StudyLenses } from '@site/src/lib/study-lenses/index.js';

const SCENARIOS = [
	'OK',
	'FAIL_AT_TOKENIZE',
	'FAIL_AT_PARSE',
	'FAIL_AT_CREATE',
	'VALIDATION_FAIL',
] as const;

export default function StudyLensesSmoke(): React.JSX.Element {
	const [snippet, setSnippet] = React.useState<string>('OK');
	return (
		<Layout title="study-lenses smoke" description="StudyLenses sandbox harness">
			<main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>study-lenses smoke</h1>
				<p>
					Sandbox harness for <code>&lt;StudyLenses&gt;</code> (mounted
					directly, bypassing the plugin). Type broken JS —{' '}
					<code>let x = ;</code> — and hover the red gutter marker after a
					beat: the friendly interpreted explanation supersedes the terse
					parse message. Fix the line and it clears. <code>var x = 1</code>{' '}
					shows the structural JEJ marker but no interpretation yet (embody's
					validating slice is pending — expected).
				</p>
				<p>
					<strong>Current sentinel:</strong> <code>{snippet}</code> (buttons
					remount the orchestrator — <code>snippet</code> is initial-value
					only)
				</p>
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
					{SCENARIOS.map(function renderButton(name) {
						return (
							<button
								key={name}
								type="button"
								onClick={function selectScenario() {
									setSnippet(name);
								}}
							>
								{name}
							</button>
						);
					})}
				</div>
				<div style={{ marginTop: '1.5rem' }}>
					<StudyLenses key={snippet} snippet={snippet} />
				</div>
			</main>
		</Layout>
	);
}
