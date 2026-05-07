/**
 * @file `<EditorComponent>` — the orchestrator's home-base React
 * component. Renders the always-mounted surface where the learner's
 * snippet appears.
 *
 * **F1.C scope** (this commit): single React component accepting only
 * `{ snippet }`, rendering `<textarea data-orchestrator-host>` with
 * the snippet as the value. Read-only in F1 — the textarea displays
 * the snippet but does not yet propagate edits back to the
 * orchestrator. F2 adds the optional `onSnippetChange?(next: string)`
 * callback (and lifts the read-only flag) so single-writer state
 * updates flow through this component. The Inc 15+ replacement swaps
 * the `<textarea>` body for a CodeMirror-backed editor at the same
 * file path, with the same prop surface and the same
 * `data-orchestrator-host` attribute on whichever element becomes the
 * outermost stable handle.
 *
 * Per [`./DOCS.md` § Structural constraints](./DOCS.md): the editor
 * never receives `embodiment` as a prop. Embodiment is a lens-mode
 * concept; the editor is editor-mode-only and the orchestrator hands
 * control off to a `<LensModule.Component>` when entering lens mode
 * (F2 onward).
 */

import React from 'react';

type EditorComponentProps = Readonly<{
	snippet: string;
}>;

export default function EditorComponent({
	snippet,
}: EditorComponentProps): React.JSX.Element {
	return <textarea data-orchestrator-host readOnly value={snippet} />;
}
