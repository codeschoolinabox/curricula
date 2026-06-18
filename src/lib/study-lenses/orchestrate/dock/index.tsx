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

type DockProperties = Readonly<{
	/** The dock's display state — surfaced as `data-orchestrator-dock-collapsed`. */
	readonly collapsed: boolean;

	/** Called when the learner clicks the collapse/expand affordance. */
	readonly onCollapseToggle: () => void;
}>;

/**
 * Renders the dock: a collapsible affordance container. Collapsing hides
 * the controls strip; the Run affordance and output surface stay reachable.
 */
function Dock({ collapsed, onCollapseToggle }: DockProperties): React.JSX.Element {
	return (
		<div
			data-orchestrator-dock
			data-orchestrator-dock-collapsed={collapsed ? 'true' : 'false'}
		>
			<button
				type="button"
				aria-label="toggle dock controls"
				onClick={onCollapseToggle}
			>
				{collapsed ? 'Expand' : 'Collapse'}
			</button>
		</div>
	);
}

export default Dock;
