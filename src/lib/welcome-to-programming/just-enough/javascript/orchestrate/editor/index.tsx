/**
 * @file `<EditorComponent>` — the orchestrator's home-base React
 * component. Renders the always-mounted surface where the learner
 * edits the snippet string.
 *
 * **F2.1 scope**: writable textarea controlled by the orchestrator's
 * `useState` slot. The `snippet` prop is the controlled value;
 * `onSnippetChange?(next)` is the single write path — the orchestrator
 * threads its `setSnippet` setter through this callback so edits flow
 * back and update the orchestrator's internal snippet state. Omitting
 * the callback is valid for display-only mounts (tests, fixtures).
 *
 * The Inc 15+ replacement swaps the `<textarea>` body for a
 * CodeMirror-backed editor at the same file path, with the same prop
 * surface and the same `data-orchestrator-host` attribute on whichever
 * element becomes the outermost stable handle.
 *
 * Per [`./DOCS.md` § Structural constraints](./DOCS.md): the editor
 * never receives `embodiment` as a prop. Embodiment is a lens-mode
 * concept; the orchestrator hands control off to a
 * `<LensModule.Component>` when entering lens mode.
 */

import React from 'react';

type EditorComponentProps = Readonly<{
	snippet: string;
	onSnippetChange?: (next: string) => void;
}>;

export default function EditorComponent({
	snippet,
	onSnippetChange,
}: EditorComponentProps): React.JSX.Element {
	return (
		<textarea
			aria-label="Code snippet editor"
			data-orchestrator-host
			value={snippet}
			onChange={(e) => onSnippetChange?.(e.target.value)}
		/>
	);
}
