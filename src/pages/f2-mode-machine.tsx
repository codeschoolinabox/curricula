/**
 * @file F2.3 sandbox harness for the editor-vs-lens 2-mode state machine.
 *
 * **What to verify** (open `http://localhost:3000/f2-mode-machine` after
 * `npm run start`):
 *
 * 1. **Initial state**: the editor textarea is visible (`data-orchestrator-host`);
 *    no lens panel is present.
 * 2. **Toggle to lens**: click "Toggle lens" → `debug-props` lens panel appears;
 *    textarea is gone. The embodiment panels (snippet, status, validation, config)
 *    should render.
 * 3. **Toggle back**: click "Toggle lens" again → editor returns; lens is gone.
 * 4. **Type between toggles**: free-form typing is fine — embody never fires
 *    on keystrokes (F2.4 removed the unconditional `useEmbodiment`). Edits
 *    persist in the textarea across the lens→editor round trip; cursor
 *    position resets on re-mount, which is expected. To toggle the result
 *    INTO a lens after typing, end on a known sentinel (e.g. `FAIL_AT_PARSE`)
 *    so the embody mock can dispatch it on the next lens-open.
 * 5. **Cache invalidation** (F2.5 wired): any edit eagerly clears the cached
 *    embodiment, even an edit that is later undone back to the original
 *    snippet. The next editor → lens transition always re-embodies after an
 *    edit; toggling back-and-forth WITHOUT editing reuses the cached
 *    embodiment (count stays at 1 across the round trip).
 *
 * The render counter in the header counts how many times the top-level wrapper
 * re-renders, giving a rough "did the state machine batch correctly" signal without
 * React DevTools.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a
 * page, not a unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import { StudyLenses } from '@site/src/lib/welcome-to-programming/just-enough/javascript/index.js';

export default function F2ModeMachine(): React.JSX.Element {
	const [lens, setLens] = React.useState<string | undefined>(undefined);
	const renderCount = React.useRef(0);
	renderCount.current += 1;

	return (
		<Layout
			title="F2 mode machine"
			description="F2.3 sandbox — editor-vs-lens 2-mode state machine toggle"
		>
			<main style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>F2 mode machine sandbox</h1>
				<p>
					Render count: <strong>{renderCount.current}</strong> — resets on
					full-page reload; tracks wrapper re-renders from toggle clicks.
					<em> (×2 in Strict Mode dev — expect even numbers)</em>
				</p>
				<p>
					<strong>Current mode:</strong>{' '}
					<code>{lens !== undefined ? `lens="${lens}"` : 'editor (no lens)'}</code>
				</p>
				<button
					type="button"
					onClick={() =>
						setLens((l) => (l !== undefined ? undefined : 'debug-props'))
					}
					style={{ marginBottom: '1rem' }}
				>
					Toggle lens ({lens !== undefined ? 'lens → editor' : 'editor → lens'})
				</button>
				<div>
					<StudyLenses snippet="OK" lens={lens} />
				</div>
			</main>
		</Layout>
	);
}
