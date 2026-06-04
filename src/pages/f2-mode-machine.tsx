/**
 * @file F2.3 sandbox harness for the editor-vs-lens 2-mode state machine.
 *
 * **What to verify** (open `http://localhost:3000/spiralearn/f2-mode-machine`
 * after `npm run start` — note the Docusaurus `baseUrl: '/spiralearn/'`
 * prefix per `docusaurus.config.ts`):
 *
 * 1. **Initial state**: the CodeMirror editor is visible (`data-orchestrator-host`
 *    on the host `<div>`); no lens panel is present.
 * 2. **Toggle to lens**: click "Toggle lens" → `debug-props` lens panel appears;
 *    the editor is gone. The embodiment panels (snippet, status, validation, config)
 *    should render.
 * 3. **Toggle back**: click "Toggle lens" again → editor returns; lens is gone.
 * 4. **Type between toggles**: free-form typing is fine — embody never fires
 *    on keystrokes (F2.4 removed the unconditional `useEmbodiment`). Edits
 *    persist in the editor across the lens→editor round trip; cursor
 *    position resets on re-mount, which is expected. To toggle the result
 *    INTO a lens after typing, end on a known sentinel (e.g. `FAIL_AT_PARSE`)
 *    so the embody mock can dispatch it on the next lens-open.
 * 5. **Cache invalidation** (F2.5 wired): any edit eagerly clears the cached
 *    embodiment, even an edit that is later undone back to the original
 *    snippet. The next editor → lens transition always re-embodies after an
 *    edit; toggling back-and-forth WITHOUT editing reuses the cached
 *    embodiment (count stays at 1 across the round trip).
 *
 * For accurate render-count measurement, use React DevTools Profiler —
 * a page-rendered counter is unreliable under StrictMode and Docusaurus
 * Layout re-render behavior.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import { StudyLenses } from '@site/src/lib/just-enough/javascript/index.js';

export default function F2ModeMachine(): React.JSX.Element {
	const [lens, setLens] = React.useState<string | undefined>();

	return (
		<Layout
			title="F2 mode machine"
			description="F2.3 sandbox — editor-vs-lens 2-mode state machine toggle"
		>
			<main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>F2 mode machine sandbox</h1>
				<p>
					<strong>Current mode:</strong>{' '}
					<code>
						{lens === undefined ? 'editor (no lens)' : `lens="${lens}"`}
					</code>
				</p>
				<button
					type="button"
					onClick={() =>
						setLens((l) => (l === undefined ? 'debug-props' : undefined))
					}
					style={{ marginBottom: '1rem' }}
				>
					Toggle lens ({lens === undefined ? 'editor → lens' : 'lens → editor'})
				</button>
				<div>
					<StudyLenses snippet="OK" {...(lens === undefined ? {} : { lens })} />
				</div>
			</main>
		</Layout>
	);
}
