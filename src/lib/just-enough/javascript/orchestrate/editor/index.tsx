/**
 * @file `<EditorComponent>` — the orchestrator's home-base React component.
 * Mounts a CodeMirror `EditorView` via the
 * [`../lib/editing/`](../lib/editing/) factory.
 *
 * The `snippet` prop is the controlled initial-value AND the external-sync
 * source of truth. CodeMirror's `updateListener` fires `onSnippetChange?`
 * synchronously on every `docChanged` transaction, preserving the F2.5
 * 1:1 transaction-to-callback contract that the orchestrator's cache
 * invalidation builds on.
 *
 * Lifecycle per [`./DOCS.md` § Execution phases](./DOCS.md):
 *   1. Mount initiation — host `<div>` renders; `useEffect` calls
 *      `createEditor(snippet, { parent, language, linters, onChange })`.
 *   2. Mount resolution — success → store editor handle; cancellation →
 *      destroy the late-arriving instance; rejection → render fallback
 *      with `data-orchestrator-error`.
 *   3. Learner edit — CM transaction fires `onChange` (the consumer's
 *      `onSnippetChange`).
 *   4. Prop sync — external snippet prop change writes into the live
 *      document (equality-guarded; null-handle-guarded).
 *   5. Unmount — cleanup destroys the editor and removes the DOM subtree.
 */

import React from 'react';

import lintJej from '../../lib/linting/lint-jej.js';
import createEditor from '../lib/editing/create-editor.js';

import type { EditorInstance } from '../lib/editing/types.js';

type EditorComponentProps = Readonly<{
	snippet: string;
	onSnippetChange?: (next: string) => void;
}>;

function EditorComponent({
	snippet,
	onSnippetChange,
}: EditorComponentProps): React.JSX.Element {
	const hostRef = React.useRef<HTMLDivElement | null>(null);
	const editorRef = React.useRef<EditorInstance | null>(null);
	const [mountError, setMountError] = React.useState<unknown>(null);

	// Ref shadow for the latest `snippet` prop — read inside the mount
	// effect's `.then` to resolve the prop-change-during-mount race per
	// DOCS.md § Structural constraints. The mount-effect deps array is
	// empty so the closure-captured `snippet` is the first-render value;
	// the ref carries the latest.
	const snippetRef = React.useRef(snippet);
	snippetRef.current = snippet;

	// Ref shadow for the latest `onSnippetChange` callback — invoked via
	// `onChangeCallback` so consumer-side callback identity changes are
	// honored without unmount/remount.
	const onSnippetChangeRef = React.useRef(onSnippetChange);
	onSnippetChangeRef.current = onSnippetChange;

	// Stable `onChange` callback passed to createEditor at mount time.
	// The ref-shadow indirection (`onSnippetChangeRef`) absorbs
	// consumer-side callback identity changes during the mount lifetime
	// without re-mounting CodeMirror: a parent that re-renders with a
	// new `onSnippetChange` reference (rare under the orchestrator's
	// stable useCallback, but common for ad-hoc test fixtures) still
	// gets its latest callback invoked on every transaction.
	const onChangeCallback = React.useCallback(function notifyParent(next: string): void {
		onSnippetChangeRef.current?.(next);
	}, []);

	// Mount effect — fires once per mount. The cancellation flag (ref,
	// matching the codebase's `isMountedRef` pattern at orchestrate/
	// index.tsx) gates late-arriving promise resolutions so a quick
	// mount → unmount cycle (e.g. React 18 StrictMode dev double-invoke)
	// does not leak a post-unmount EditorView into the DOM. Named
	// function expression (not arrow) because useEffect's callback body
	// requires a block.
	React.useEffect(function mountEffect() {
		const cancelledRef = { current: false };
		const host = hostRef.current;
		// host is virtually always populated by the time useEffect fires
		// (React's ref attach happens between render commit and effect
		// run); the guard exists for TS narrowing of the union type.
		if (host) void createEditor(snippetRef.current, {
			parent: host,
			language: 'javascript',
			linters: [lintJej],
			onChange: onChangeCallback,
		}).then(
			function onMounted(instance) {
				if (cancelledRef.current) {
					instance.destroy();
					return;
				}
				editorRef.current = instance;
				// Race recovery: if `snippet` prop changed between mount
				// initiation and resolution, write the latest into the live
				// document now. The post-mount sync effect would not re-fire
				// (its deps array depends on `snippet`, and React already
				// re-rendered before mount resolved — by the time we get
				// here, the prop change has already been committed and
				// React's sync effect ran while editorRef was still null).
				// Note: this write triggers `onChange` (via CM's updateListener),
				// so a consumer-provided `onSnippetChange` will see one call
				// for content the user never typed. Under the orchestrator's
				// wiring this is benign (it re-sets the same state); side-
				// effecting consumers (logging, analytics) should de-dupe.
				if (instance.content !== snippetRef.current) {
					instance.content = snippetRef.current;
				}
			},
			function onMountRejected(error: unknown) {
				if (cancelledRef.current) return;
				console.warn('createEditor rejected:', error);
				setMountError(error);
			},
		);

		return function cleanup() {
			cancelledRef.current = true;
			if (editorRef.current) {
				editorRef.current.destroy();
				editorRef.current = null;
			}
		};
	}, []);

	// Prop-sync effect — fires when the snippet prop changes. Skips when
	// the editor handle is not yet resolved (the mount-race null-handle
	// guard per DOCS.md § Structural constraints — Sync-effect resilience).
	// Skips when the prop already matches the live document content (the
	// own-write echo guard for the orchestrator setState round-trip).
	React.useEffect(function snippetSyncEffect() {
		const editor = editorRef.current;
		if (!editor) return;
		if (editor.content === snippet) return;
		editor.content = snippet;
	}, [snippet]);

	if (mountError !== null) {
		return (
			<div
				aria-label="Code snippet editor (failed to load)"
				data-orchestrator-host
				data-orchestrator-error
			/>
		);
	}

	return (
		<div
			aria-label="Code snippet editor"
			data-orchestrator-host
			ref={hostRef}
		/>
	);
}

export default EditorComponent;
