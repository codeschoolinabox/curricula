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
 * 4. **Type between toggles** (F2.4 unlocks free-form typing): until F2.4
 *    removes the unconditional `useEmbodiment`, typing any non-sentinel text
 *    triggers an embody mock throw. Replace the textarea contents with another
 *    valid sentinel (e.g. `FAIL_AT_PARSE`) — value persists across the round
 *    trip (cursor position resets on re-mount, which is expected).
 * 5. **Cache invalidation** (F2.5 — not yet wired): after swapping sentinels,
 *    toggle to lens — embody should re-fire (confirmed in F2.5).
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
