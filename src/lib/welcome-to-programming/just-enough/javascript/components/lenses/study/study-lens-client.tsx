/**
 * @file Browser-only client of the study lens. Owns the CodeMirror
 * editor instance's React-side lifecycle — mounts via the async
 * `createEditor` factory, attaches the editor DOM into a ref'd
 * container, and tears down via `editor.destroy()` on unmount.
 *
 * @remarks Lives behind `<BrowserOnly>`; free to reference `document`
 * via React refs. The factory is async, so the `useEffect` handles
 * three scenarios correctly (each asserted by tests):
 *
 *   1. Happy path — factory resolves before unmount, editor attaches,
 *      state updates, destroy fires on later unmount.
 *   2. Unmount-before-resolve — component unmounts while factory is
 *      in flight; when the promise eventually resolves, the resolved
 *      instance must be destroyed, NOT attached, and `setEditor`
 *      must NOT fire. The `cancelled` flag captures this.
 *   3. StrictMode double-invoke — dev-mode mount → cleanup → mount
 *      within a single commit; exactly one attached editor survives,
 *      exactly one destroy() fires on the obsolete first instance.
 *
 * The dep array is empty — the `code` prop is captured ONCE at mount
 * per COMPONENT-CONTRACT.md §Rendering contract / Identity. Hot-reload
 * in dev mode goes through a full Docusaurus route re-mount, which
 * gives the author a fresh lens naturally; in production the site is
 * statically built. Either way, the editor never needs to react to a
 * `code` prop change in place — doing so would blow away learner edits.
 */

import React, { useEffect, useId, useRef, useState } from 'react';

import createEditor from '../../../lib/editing/create-editor.js';
import { format as apiFormat } from '../../../api/format.js';
import run from '../../../api/run.js';

import type { EditorInstance } from '../../../lib/editing/types.js';
import type { StudyOptions } from './types.js';

type StudyLensClientProps = {
	readonly code: string;
	readonly options: StudyOptions;
};

/**
 * Mounts a CodeMirror editor inside a ref'd container on first render.
 * Cleans up on unmount — including the unmount-before-factory-resolves
 * race path.
 */
const DEFAULT_ENGINE = { seconds: 5 } as const;

function StudyLensClient({
	code,
	options,
}: StudyLensClientProps): React.JSX.Element {
	const lensId = useId();
	const containerRef = useRef<HTMLDivElement>(null);
	const [editor, setEditor] = useState<EditorInstance | null>(null);
	// Independent of the editor null-gate: Run disables while an
	// in-flight runner promise is pending. Both conditions can hold
	// simultaneously (editor just resolved, Run clicked, promise
	// in-flight — `!editor` is false but `isRunning` is true).
	const [isRunning, setIsRunning] = useState(false);

	useEffect(() => {
		let cancelled = false;
		let instance: EditorInstance | null = null;
		(async () => {
			const container = containerRef.current;
			const created = await createEditor(code, {
				language: 'javascript',
				format: apiFormat,
				// Conditional spread: under `exactOptionalPropertyTypes`, a
				// literal `parent: undefined` is a type error. When the ref
				// hasn't attached yet we omit `parent` and let the factory
				// create its own div.
				...(container === null ? {} : { parent: container }),
			});
			instance = created;
			if (cancelled) {
				created.destroy();
				return;
			}
			setEditor(created);
		})().catch((err: unknown) => {
			// AR-4 #7: log-and-forget rejection hygiene. V1 doesn't render an
			// error state — if `createEditor` rejects the lens stays blank
			// and the learner sees the `<BrowserOnly>` fallback. A future
			// commit can add a visible error boundary.
			console.warn('study lens: createEditor rejected', err);
		});
		return () => {
			cancelled = true;
			if (instance !== null) instance.destroy();
		};
		// Empty deps: bind-once per COMPONENT-CONTRACT §Identity. Hot-reload
		// in dev goes through a full Docusaurus route re-mount, which hands
		// the lens fresh props naturally; production is statically built.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function handleRun(): Promise<void> {
		if (editor === null) return;
		setIsRunning(true);
		try {
			// V1 runners are async-void: we await the runner's settlement
			// purely to gate the button; the RunResult is discarded.
			// Side-effect output (e.g. `console.log`) surfaces to the
			// browser devtools console.
			await run(editor.content, options.engine ?? DEFAULT_ENGINE);
		} finally {
			setIsRunning(false);
		}
	}

	function handleFormat(): void {
		if (editor === null) return;
		editor.format();
	}

	function handleReset(): void {
		if (editor === null) return;
		// Writes the `code` prop captured at mount back into the editor
		// buffer. `editor.reset()` would also work today (createEditor
		// stores the `code` arg as its reset target), but writing
		// through `content` expresses the intent without relying on
		// the factory's reset semantics remaining stable.
		editor.content = code;
	}

	return (
		<div className="study-lens" data-lens-id={lensId}>
			<div ref={containerRef} data-study-lens="study" />
			<div className="study-lens-toolbar" role="toolbar" aria-label="Code actions">
				<button
					type="button"
					aria-label="Run code"
					onClick={handleRun}
					disabled={editor === null || isRunning}
				>
					Run
				</button>
				<button
					type="button"
					aria-label="Format code"
					onClick={handleFormat}
					disabled={editor === null}
				>
					Format
				</button>
				<button
					type="button"
					aria-label="Reset to original"
					onClick={handleReset}
					disabled={editor === null}
				>
					Reset
				</button>
			</div>
		</div>
	);
}

export default StudyLensClient;
export type { StudyLensClientProps };
