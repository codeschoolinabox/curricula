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

type ToolbarProperties = Readonly<{
	/**
	 * The registered lens names, in registration order. The picker
	 * renders one `<option value={name}>{name}</option>` per entry. The
	 * caller (`<StudyLenses>`) supplies `Object.keys(LENS_REGISTRY)`;
	 * future increments may filter (e.g. by `applicableTo(embodiment)`)
	 * but the picker treats the array as the authoritative roster.
	 */
	readonly lensNames: readonly string[];

	/**
	 * The picker's currently-selected value, derived by the parent from
	 * orchestrator state: `state.mode === 'lens' ? state.activeLens : ''`.
	 * The empty string selects the disabled sentinel (editor mode); a
	 * registered lens name selects that option (lens mode).
	 */
	readonly pickerValue: string;

	/**
	 * Called when the learner selects a registered lens. The argument is
	 * the chosen lens name (never the sentinel's empty string — Toolbar
	 * filters that case). The parent routes the call into the shared
	 * orchestrator transition handler with `source: 'picker'`.
	 */
	readonly onLensSelect: (name: string) => void;

	/**
	 * Whether to render the edit-return button. Derived by the parent
	 * from `state.mode === 'lens'`; the button is the learner's
	 * affordance to leave a read-only lens session and return to editor
	 * home base.
	 */
	readonly editButtonVisible: boolean;

	/**
	 * Called when the learner clicks the edit-return button. The parent
	 * routes the call into the shared orchestrator transition handler
	 * which dispatches `mode-changed({from: 'lens', to: 'editor'})`.
	 */
	readonly onEditReturn: () => void;
}>;

/**
 * Renders the toolbar shell and the lens-picker dropdown.
 *
 * @param lensNames - Registered lens names to expose in the picker.
 * @param pickerValue - The currently-selected picker value (state-derived).
 * @param onLensSelect - Called with the chosen lens name on picker change.
 */
function Toolbar({
	lensNames,
	pickerValue,
	onLensSelect,
	editButtonVisible,
	onEditReturn,
}: ToolbarProperties): React.JSX.Element {
	function handlePickerChange(
		event: React.ChangeEvent<HTMLSelectElement>,
	): void {
		const next = event.target.value;
		if (next === '') return;
		onLensSelect(next);
	}
	return (
		<nav data-orchestrator-toolbar>
			<select
				data-orchestrator-lens-picker
				aria-label="Lens picker"
				value={pickerValue}
				onChange={handlePickerChange}
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
			{editButtonVisible ? (
				<button
					type="button"
					data-orchestrator-edit-button
					onClick={onEditReturn}
				>
					Edit code
				</button>
			) : null}
		</nav>
	);
}

export default Toolbar;
