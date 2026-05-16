/**
 * @file F1 sandbox harness for `<StudyLenses>`. Mounts the orchestrator
 * directly with hardcoded snippets so the F1 chain
 * (snippet → embody → frozen Snippet → editor home base) can be
 * observed in a real browser via the Docusaurus dev server.
 *
 * Plugin alignment is post-F1 cross-tier work (per
 * `.planning-handoffs/03-orchestrator-and-contracts.md` § Cross-handoff
 * impact); this harness mounts `<StudyLenses>` directly to bypass the
 * pre-refactor plugin emit shape during the F1 window.
 *
 * **How to use** (after `npm run start`):
 *
 * 1. Open `http://localhost:3000/study-lenses-smoke` in a browser.
 * 2. Open React DevTools → Components → select `StudyLenses`.
 * 3. Verify the `useEmbodiment` debug value is a frozen `Snippet`
 *    with `status.{tokenized,parsed,created}` reflecting the chosen
 *    sentinel.
 * 4. Verify the `<textarea data-orchestrator-host>` displays the
 *    snippet text and is read-only (F1 has no edit propagation).
 * 5. Click the sentinel buttons to swap snippets and confirm the
 *    embodiment + textarea both update.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test. No corresponding `.test.tsx` file.
 */

import Layout from '@theme/Layout';
import React from 'react';

import { StudyLenses } from '@site/src/lib/just-enough/javascript/index.js';

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
		<Layout title="study-lenses smoke" description="F1 sandbox harness">
			<main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>study-lenses smoke (F1)</h1>
				<p>
					Hardcoded harness for the F1 chain. Plugin alignment is post-F1
					cross-tier work; this page mounts <code>&lt;StudyLenses&gt;</code>{' '}
					directly. Open React DevTools and inspect <code>StudyLenses</code>{' '}
					&rarr; <code>useEmbodiment</code> debug value to see the frozen{' '}
					<code>Snippet</code>.
				</p>
				<p>
					<strong>Current sentinel:</strong> <code>{snippet}</code>
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
					<StudyLenses snippet={snippet} />
				</div>
			</main>
		</Layout>
	);
}
