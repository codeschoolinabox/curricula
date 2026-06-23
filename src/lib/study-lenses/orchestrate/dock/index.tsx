/**
 * @file `<Dock>` — the omnipresent region's run/debug surface: a
 * collapsible affordance container + output surface. **Presentation
 * only.** The orchestrator ([`../index.tsx`](../index.tsx)) owns every
 * state slot (source type, sandbox mode, run limits, collapse), the run
 * lifecycle (it invokes `evaluation.events.{run, intercept}` on the live
 * embodiment and accumulates the output), and the bus dispatch. This
 * module imports no `embody`, dispatches no bus events, and holds no
 * orchestrator state — it never sees the `Snippet`. It renders what it is
 * handed and routes intent up through `on…` callbacks.
 *
 * Selector contract (locked — [`../README.md` § Data attributes](../README.md)):
 * `data-orchestrator-dock` on the root; `data-orchestrator-dock-collapsed`
 * carries the display state. Value-bearing attributes carry the current
 * value; tests anchor on attribute + value, never label text.
 */

import React from 'react';

import type { SnippetType } from '../../embody/types.js';

type DockProperties = Readonly<{
	/** The dock's display state — surfaced as `data-orchestrator-dock-collapsed`. */
	readonly collapsed: boolean;

	/** Called when the learner clicks the collapse/expand affordance. */
	readonly onCollapseToggle: () => void;

	/**
	 * The current source type — the type toggle's value, surfaced as
	 * `data-orchestrator-dock-type-toggle="script|module"`.
	 */
	readonly sourceType: SnippetType;

	/**
	 * Whether module-admissible code is sitting in script mode (the
	 * orchestrator-derived condition under which the adjacent hint shows).
	 */
	readonly scriptModeHintVisible: boolean;

	/** Called when the learner clicks the type toggle (a flip; takes no argument). */
	readonly onTypeToggle: () => void;
}>;

/**
 * Renders the dock: a collapsible affordance container. The collapse
 * affordance points at the controls strip via `aria-controls`; the strip
 * holds the type toggle (+ adjacent script-mode hint) and the later controls.
 * Collapsing is a visual concern driven off `data-orchestrator-dock-collapsed`;
 * the Run affordance and output surface stay reachable.
 */
function Dock({
	collapsed,
	onCollapseToggle,
	sourceType,
	scriptModeHintVisible,
	onTypeToggle,
}: DockProperties): React.JSX.Element {
	// Per-instance element ids for the dock's intra-component ARIA wiring —
	// `useId` keeps them unique across multiple <StudyLenses> step-stones on one
	// page (the collapse affordance's aria-controls target; the type toggle's
	// aria-describedby hint).
	const reactId = React.useId();
	const controlsId = `${reactId}controls`;
	const hintId = `${reactId}hint`;
	return (
		<div
			data-orchestrator-dock
			data-orchestrator-dock-collapsed={collapsed ? 'true' : 'false'}
		>
			<button
				type="button"
				aria-label="toggle dock controls"
				aria-controls={controlsId}
				onClick={onCollapseToggle}
			>
				{collapsed ? 'Expand' : 'Collapse'}
			</button>
			<div id={controlsId}>
				<button
					type="button"
					data-orchestrator-dock-type-toggle={sourceType}
					aria-label="toggle source type between script and module"
					aria-describedby={scriptModeHintVisible ? hintId : undefined}
					onClick={onTypeToggle}
				>
					{sourceType}
				</button>
				{scriptModeHintVisible ? (
					<span id={hintId} data-orchestrator-dock-type-hint>
						Module-admissible code is running in script mode.
					</span>
				) : null}
			</div>
		</div>
	);
}

export default Dock;
