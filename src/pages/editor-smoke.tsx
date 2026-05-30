/**
 * @file Editor smoke page — mounts `<EditorComponent>` standalone so a
 * developer can eyeball the three wired callbacks (`lintJej`,
 * `formatJej`, `completeJej`) on the live Docusaurus site.
 *
 * Deep-imports `<EditorComponent>` from `orchestrate/editor/index.js`
 * rather than going through `<StudyLenses>` so the smoke surface isolates
 * the editor home base from the orchestrator's lens machinery. The page
 * owns snippet state and wires `console.log` to `onSnippetChange` for
 * dev-time transaction-to-callback verification — no source-side debug
 * tracing required.
 *
 * Initial snippet is blank by design — this page is a callback-verification
 * surface, not a sample browser.
 *
 * **How to use** (after `npm run start`):
 *
 * 1. Open `http://localhost:3000/editor-smoke` in a browser.
 * 2. Type `var x = 5; function f(){return 1}` — `var` and `function`
 *    surface JEJ lint markers via `lintJej`.
 * 3. Press `Ctrl-Shift-F` (or `Cmd-Shift-F` on macOS) — `formatJej`
 *    reformats to Prettier-canonical (tab indentation, single quotes,
 *    semicolons, ≤80-col wrap).
 * 4. Type after a `.` or press `Ctrl-Space` — `completeJej` surfaces the
 *    curated member union; blocked tokens carry `(not in JEJ)` tooltips.
 * 5. Watch the browser console — `[editor-smoke] onSnippetChange:` logs
 *    once per `docChanged` transaction (1:1 per the editor's
 *    transaction-to-callback contract).
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test. No corresponding `.test.tsx` file.
 */

import Layout from '@theme/Layout';
import React from 'react';

import EditorComponent from '@site/src/lib/just-enough/javascript/orchestrate/editor/index.js';

function logSnippetChange(next: string): void {
	console.log('[editor-smoke] onSnippetChange:', next.length, 'chars');
}

function EditorSmoke(): React.JSX.Element {
	const [snippet, setSnippet] = React.useState<string>('');

	const handleSnippetChange = React.useCallback(
		function notifyParent(next: string): void {
			setSnippet(next);
			logSnippetChange(next);
		},
		[],
	);

	return (
		<Layout title="editor smoke" description="EditorComponent smoke harness">
			<main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>editor smoke</h1>
				<p>
					Smoke surface for <code>&lt;EditorComponent&gt;</code>. Type into
					the editor below to exercise the three wired callbacks. Open the
					browser console to watch <code>onSnippetChange</code> log once per{' '}
					<code>docChanged</code> transaction.
				</p>
				<ul>
					<li>
						<code>lintJej</code> — type <code>var</code> or{' '}
						<code>function</code> to surface JEJ lint markers.
					</li>
					<li>
						<code>formatJej</code> — press <kbd>Ctrl-Shift-F</kbd> (or{' '}
						<kbd>Cmd-Shift-F</kbd> on macOS) to reformat to Prettier-canonical.
					</li>
					<li>
						<code>completeJej</code> — type after a <code>.</code> or press{' '}
						<kbd>Ctrl-Space</kbd> for the curated member union; blocked tokens
						carry tooltips.
					</li>
				</ul>
				<div style={{ marginTop: '1.5rem' }}>
					<EditorComponent
						snippet={snippet}
						onSnippetChange={handleSnippetChange}
					/>
				</div>
			</main>
		</Layout>
	);
}

export default EditorSmoke;
