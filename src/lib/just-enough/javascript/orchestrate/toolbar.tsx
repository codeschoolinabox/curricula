/**
 * @file `<Toolbar>` — the always-visible affordance container at the top
 * of `<StudyLenses>`. Per the contract in
 * [`./README.md`](./README.md) § The two selection surfaces and
 * [`./DOCS.md`](./DOCS.md) § Toolbar data flow, the toolbar shell is
 * invariant; its contents are mode-aware:
 *
 * - A **lens-picker dropdown** (`<select data-orchestrator-lens-picker>`)
 *   over the registered lenses, always rendered.
 * - A **conditional edit button**
 *   (`<button data-orchestrator-edit-button>`) that appears only when
 *   `state.mode === 'lens'`.
 *
 * L1.3 ships the picker dropdown with one `<option>` per registered
 * lens. The neutral state (editor-mode sentinel), the
 * derive-value-from-state wiring, the onChange dispatch, and the edit
 * button all land in subsequent L1 increments.
 */

import React from 'react';

type ToolbarProps = Readonly<{
	/**
	 * The registered lens names, in registration order. The picker
	 * renders one `<option value={name}>{name}</option>` per entry. The
	 * caller (`<StudyLenses>`) supplies `Object.keys(LENS_REGISTRY)`;
	 * future increments may filter (e.g. by `applicableTo(embodiment)`)
	 * but the picker treats the array as the authoritative roster.
	 */
	lensNames: readonly string[];
}>;

/**
 * Renders the toolbar shell and the lens-picker dropdown.
 *
 * @param lensNames - Registered lens names to expose in the picker.
 */
function Toolbar({ lensNames }: ToolbarProps): React.JSX.Element {
	return (
		<nav data-orchestrator-toolbar>
			<select
				data-orchestrator-lens-picker
				aria-label="Lens picker"
				defaultValue=""
			>
				<option value="" disabled hidden>
					— select a lens —
				</option>
				{lensNames.map((name) => (
					<option key={name} value={name}>
						{name}
					</option>
				))}
			</select>
		</nav>
	);
}

export default Toolbar;
