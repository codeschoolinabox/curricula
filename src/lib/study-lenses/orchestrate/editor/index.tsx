/**
 * The Editor component — the editing surface the orchestrator renders. A thin
 * React wrapper over the async editor factory: it owns the StrictMode-safe
 * mount lifecycle (cancellation, race recovery, error fallback) and routes
 * edits upward; every editing behavior lives in the factory behind the
 * callback boundary.
 *
 * @remarks
 * Mount is async (the factory loads the grammar on demand), so the component
 * guards three races: a mount superseded before it resolves destroys what it
 * built (StrictMode's double-invoke leaves exactly one live surface); a
 * `snippet` prop change during the in-flight mount is written once the mount
 * resolves (latest wins, never a stale seed); a factory rejection renders the
 * fallback element carrying `data-editor-error` — the page never goes down.
 * A later `snippet` prop change writes into the live document as an
 * own-write, which the factory never echoes back as an edit event.
 */

import React from 'react';

import createEditor from './lib/create-editor.js';
import type { EditorInstance, EditorProperties } from './types.js';

export default function Editor({
	snippet,
	onEdit,
}: EditorProperties): React.JSX.Element {
	const hostReference = React.useRef<HTMLDivElement | null>(null);
	const editorReference = React.useRef<EditorInstance | null>(null);
	// null = no error. Sound because every factory rejection is an Error; a
	// bare `Promise.reject(null)` would collide with the sentinel — if the
	// factory ever grows such a path, switch to a discriminated shape.
	const [mountError, setMountError] = React.useState<unknown>(null);

	// Ref shadows: the mount effect runs once, so its closure holds
	// first-render values; the refs carry the latest prop and callback so a
	// resolving mount and every relayed edit read current state.
	const snippetReference = React.useRef(snippet);
	snippetReference.current = snippet;
	const onEditReference = React.useRef(onEdit);
	onEditReference.current = onEdit;

	// 2. Edit relay — lives entirely in the factory; this component only
	//    wires the callback, routed through the ref shadow so a changed
	//    onEdit prop is honored without remounting CodeMirror.
	const relayEdit = React.useCallback(function relayLatest(
		source: string,
	): void {
		onEditReference.current(source);
	}, []);

	// 1. Mount (async, cancellable) — the cancellation flag gates the
	//    late-arriving resolution: a superseded mount (StrictMode's
	//    double-invoke, a quick unmount) destroys the instance it built.
	React.useEffect(
		function mountEffect() {
			const cancelled = { current: false };
			// The host is populated by the time the effect fires (React
			// attaches refs between commit and effects); the guard exists for
			// TS narrowing of the null union.
			const host = hostReference.current;
			if (host)
				void createEditor(snippetReference.current, {
					onEdit: relayEdit,
					parent: host,
				}).then(
					function onMounted(instance) {
						if (cancelled.current) {
							instance.destroy();
							return;
						}
						editorReference.current = instance;
						// Race recovery: a snippet prop change during the
						// in-flight mount already re-rendered; the sync effect
						// saw a null handle and skipped. Write the latest now.
						if (instance.getContent() !== snippetReference.current) {
							instance.setContent(snippetReference.current);
						}
					},
					function onRejected(error: unknown) {
						if (cancelled.current) return;
						console.warn('createEditor rejected:', error);
						setMountError(error);
					},
				);

			// 4. Teardown — supersession and unmount share one path: flag the
			//    in-flight mount cancelled, destroy whatever already resolved.
			return function cancelMount() {
				cancelled.current = true;
				if (editorReference.current) {
					editorReference.current.destroy();
					editorReference.current = null;
				}
			};
		},
		[relayEdit],
	);

	// 3. External write — a changed snippet prop writes into the live
	//    document; the factory tags it an own-write, so it never echoes. The
	//    equality skip is not an echo guard (the factory owns echoes): it
	//    keeps an equal-value round-trip from clobbering the selection with a
	//    redundant write.
	React.useEffect(
		function syncSnippetEffect() {
			const editor = editorReference.current;
			if (!editor) return;
			if (editor.getContent() === snippet) return;
			editor.setContent(snippet);
		},
		[snippet],
	);

	if (mountError !== null) {
		return (
			<div
				aria-label="Code editor (failed to load)"
				data-editor-error
				data-editor-host
			/>
		);
	}

	return <div aria-label="Code editor" data-editor-host ref={hostReference} />;
}
