/**
 * The PhasesPanel component — the mechanical render of the study layer as a
 * horizontal lifecycle strip. Pure presentation: one labeled lens select per
 * phase, in exactly the given order; an accessible phase's select lists its
 * lens names headed by the none entry and tracks the committed open lens; a
 * barred phase's select is disabled with the cause as its only entry; a
 * zero-lens phase is a disabled select, present-but-empty. The panel derives
 * nothing and never knows the canonical five.
 *
 * @remarks
 * Selector contract (data attributes; label text is never an anchor):
 * `data-phases-panel` on the strip; `data-phase="<name>"` per entry;
 * `data-phase-select` on each select; `data-phase-barred` on a barred entry;
 * `data-phase-cause` on a barred select (the cause is its option text AND
 * its native tooltip); `data-phase-lens="<name>"` per lens option — scope
 * lens queries by phase, names repeat across phases. No heading elements —
 * the strip leaves the document outline untouched.
 */

import React from 'react';

import type { PhaseEntry, PhasesPanelProperties } from './types.js';

export default function PhasesPanel({
	phases,
	openLensName,
	onOpenLens,
	onCloseLens,
}: PhasesPanelProperties): React.JSX.Element {
	function relaySelection(phase: PhaseEntry, value: string): void {
		if (value === '') {
			onCloseLens();
			return;
		}
		onOpenLens({ lens: value, phase: phase.name });
	}

	return (
		<section
			aria-label="Study phases"
			data-phases-panel
			style={{
				alignItems: 'center',
				display: 'flex',
				flexWrap: 'wrap',
				gap: '0.75rem',
			}}
		>
			{phases.map((phase) => (
				<label
					data-phase={phase.name}
					key={phase.name}
					style={{
						alignItems: 'center',
						display: 'inline-flex',
						gap: '0.35rem',
					}}
					{...(phase.accessible ? {} : { 'data-phase-barred': true })}
				>
					<span>{phase.label}</span>
					{phase.accessible ? (
						<select
							data-phase-select
							disabled={phase.lenses.length === 0}
							onChange={(event) => relaySelection(phase, event.target.value)}
							value={
								openLensName !== null && phase.lenses.includes(openLensName)
									? openLensName
									: ''
							}
						>
							<option value="">—</option>
							{phase.lenses.map((lens) => (
								<option data-phase-lens={lens} key={lens} value={lens}>
									{lens}
								</option>
							))}
						</select>
					) : (
						<select
							aria-label={`${phase.label} — barred: ${phase.cause}`}
							data-phase-cause
							data-phase-select
							disabled
							title={phase.cause}
							value=""
						>
							<option value="">⚠ {phase.cause}</option>
						</select>
					)}
				</label>
			))}
		</section>
	);
}
