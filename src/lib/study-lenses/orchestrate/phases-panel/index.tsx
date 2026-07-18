// cspell:ignore affordances

/**
 * The PhasesPanel component — the mechanical render of the study layer. Pure
 * presentation: sections render in exactly the given order, an accessible
 * phase lists its lens names as open-intent affordances, a barred phase shows
 * its cause, and a zero-lens phase renders present-but-empty. The panel
 * derives nothing and never knows the canonical five.
 *
 * @remarks
 * Selector contract (data attributes; label text is never an anchor):
 * `data-phases-panel` on the root; `data-phase="<name>"` per section;
 * `data-phase-barred` on a barred section; `data-phase-cause` on its cause;
 * `data-phase-lens="<name>"` on each lens affordance — scope lens queries by
 * phase (`[data-phase="x"] [data-phase-lens="y"]`), names repeat across
 * phases.
 */

import React from 'react';

import type { PhasesPanelProperties } from './types.js';

export default function PhasesPanel({
	phases,
	onOpenLens,
}: PhasesPanelProperties): React.JSX.Element {
	return (
		<section aria-label="Study phases" data-phases-panel>
			{phases.map((phase) =>
				phase.accessible ? (
					<section data-phase={phase.name} key={phase.name}>
						<h3>{phase.label}</h3>
						<ul>
							{phase.lenses.map((lens) => (
								<li key={lens}>
									<button
										data-phase-lens={lens}
										onClick={() => onOpenLens({ lens, phase: phase.name })}
										type="button"
									>
										{lens}
									</button>
								</li>
							))}
						</ul>
					</section>
				) : (
					<section data-phase={phase.name} data-phase-barred key={phase.name}>
						<h3>{phase.label}</h3>
						<p data-phase-cause>{phase.cause}</p>
					</section>
				),
			)}
		</section>
	);
}
