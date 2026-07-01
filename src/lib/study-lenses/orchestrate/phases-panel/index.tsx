/**
 * @file `<PhasesPanel>` — the orchestrator's affordance container: the
 * NM-lifecycle instrument that replaced the single toolbar picker. Lays
 * the SHOWN stations out left → right (source · realm · parse · creation
 * · evaluation), each station a column with its own lens dropdown, and
 * doubles as a lifecycle-status display — the layout itself teaches the
 * lifecycle, and the per-station status (how far the machine got and where
 * it tripped) renders as a compact cue on each column's
 * `data-orchestrator-station-status` attribute (no status-text label),
 * before any lens is picked.
 *
 * **Presentation only.** The panel renders what it is handed: the three
 * pure derivations (roster · availability · status) run in the
 * orchestrator (`../index.tsx`); no derivation calls, no registry
 * import, no bus dispatch live here. Selection routes up through
 * `onLensSelect` (the orchestrator supplies `source: 'panel'`);
 * edit-return routes up through `onEditReturn`.
 *
 * Selector contract (locked, Cycle 2 Phase 0):
 * `data-orchestrator-phases-panel` on the root;
 * `data-orchestrator-station="<Station>"` per column;
 * `data-orchestrator-station-status="<StationStatus>"` carries the
 * column's status; `data-orchestrator-edit-button` carries over from the
 * retired toolbar unchanged.
 */

import React from 'react';

import type { Station } from '../../lenses/types.js';
import type { StationRoster, StationStatusMap } from '../types.js';

type PhasesPanelProperties = Readonly<{
	/**
	 * The SHOWN stations, in canonical left → right order — the
	 * availability derivation's output. Hidden stations are absent
	 * entirely (fully removed, no stubs); the panel renders exactly this
	 * list in this order.
	 */
	readonly stations: readonly Station[];

	/**
	 * Per-station lens rosters (all five keys — the static roster
	 * derivation's output). Each shown station's dropdown enumerates
	 * `roster[station]` in registration order; a station with an empty
	 * roster renders a disabled, sentinel-only dropdown. (Disabling is
	 * roster-empty OR `barred`-status — see `statusMap`; a `barred` station
	 * is also disabled, error-downstream.)
	 */
	readonly roster: StationRoster;

	/**
	 * Per-station statuses (all five keys — the status derivation's
	 * output). Rendered ONLY as the `data-orchestrator-station-status`
	 * attribute (a styleable compact cue — no plain-text label). Gates
	 * interactivity in one case: a `barred` station's dropdown is disabled
	 * (error-downstream); every other status leaves it roster-driven.
	 */
	readonly statusMap: StationStatusMap;

	/**
	 * The active lens name in lens mode, `null` in editor mode. The
	 * station whose roster contains it renders it as its dropdown value;
	 * every other dropdown shows the sentinel. A panel-excluded active
	 * lens (prop-mounted, in no roster) leaves every dropdown on the
	 * sentinel.
	 */
	readonly activeLens: string | null;

	/**
	 * Called with the chosen lens name when the learner selects a
	 * non-sentinel option in any station's dropdown. The orchestrator
	 * routes it into the shared transition handler with
	 * `source: 'panel'`.
	 */
	readonly onLensSelect: (name: string) => void;

	/**
	 * Whether to render the edit-return button (lens mode only). Same
	 * semantics and selector as the retired toolbar's button.
	 */
	readonly editButtonVisible: boolean;

	/** Called when the learner clicks the edit-return button. */
	readonly onEditReturn: () => void;
}>;

/**
 * Renders the phases panel: one column per SHOWN station (status-bearing,
 * with the station's lens dropdown) plus the conditional edit-return
 * button.
 */
function PhasesPanel({
	stations,
	roster,
	statusMap,
	activeLens,
	onLensSelect,
	editButtonVisible,
	onEditReturn,
}: PhasesPanelProperties): React.JSX.Element {
	function handleSelectChange(
		event: React.ChangeEvent<HTMLSelectElement>,
	): void {
		const next = event.target.value;
		if (next === '') return;
		onLensSelect(next);
	}

	return (
		<nav data-orchestrator-phases-panel>
			{stations.map((station) => (
				<div
					key={station}
					data-orchestrator-station={station}
					data-orchestrator-station-status={statusMap[station]}
				>
					<span>{station}</span>
					<select
						aria-label={`${station} station lens picker`}
						value={
							activeLens !== null && roster[station].includes(activeLens)
								? activeLens
								: ''
						}
						onChange={handleSelectChange}
						disabled={
							roster[station].length === 0 || statusMap[station] === 'barred'
						}
					>
						<option value="" disabled hidden>
							lenses
						</option>
						{roster[station].map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>
				</div>
			))}
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

export default PhasesPanel;
