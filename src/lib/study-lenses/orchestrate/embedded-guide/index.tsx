/**
 * @file `<EmbeddedGuide>` — the omnipresent region's META tool: an
 * orchestrator-resident, **program-independent** guide to the instrument
 * itself (what the stations are, why they appear and grey out, what the
 * toggles and limits do, what danger mode risks). **Presentation only.** It
 * renders authored documentation + a reveal affordance; the orchestrator
 * ([`../index.tsx`](../index.tsx)) owns the disclosure state and threads it in.
 * This module imports no `embody`, reads no embodiment, dispatches no bus
 * events, and holds no orchestrator state — its content is the same regardless
 * of the snippet (the structural distinction from the program-dependent
 * generative lenses). The authored prose is real instrument documentation, not
 * a mock.
 *
 * Selector contract (locked — [`../README.md` § Data attributes](../README.md)):
 * `data-orchestrator-guide` on the root. The disclosure treatment is a Phase-1
 * presentational choice: the authored content renders inside a
 * `data-orchestrator-guide-content` container only when `revealed`, and each
 * topic carries a `data-orchestrator-guide-topic` value. Tests anchor on these
 * attributes, never on prose text.
 */

import React from 'react';

import './embedded-guide.css';

type EmbeddedGuideProperties = Readonly<{
	/** Whether the guide is expanded — the orchestrator-owned disclosure state. */
	readonly revealed: boolean;

	/** Called when the learner clicks the reveal affordance (a flip; no argument). */
	readonly onToggle: () => void;
}>;

/**
 * Renders the guide: a reveal affordance (carrying the disclosure label + an
 * `aria-label`) plus, when `revealed`, the authored instrument documentation
 * inside a `data-orchestrator-guide-content` container. Program-independent —
 * a pure function of `revealed` and the module's authored content.
 */
function EmbeddedGuide({
	revealed,
	onToggle,
}: EmbeddedGuideProperties): React.JSX.Element {
	return (
		<div data-orchestrator-guide>
			<button
				type="button"
				aria-label="toggle the study-tools guide"
				onClick={onToggle}
			>
				{revealed ? 'Hide the guide' : 'Show the guide'}
			</button>
			{revealed ? (
				<div data-orchestrator-guide-content>
					{GUIDE_TOPICS.map((topic) => (
						<div key={topic.id} data-orchestrator-guide-topic={topic.id}>
							<h3>{topic.heading}</h3>
							<p>{topic.body}</p>
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}

// The instrument topics the guide documents — real authored prose drawn from
// the orchestrator's own design (README § The phases panel + § The omnipresent
// region). Program-independent: the same content regardless of the snippet.
// Each `id` is both the React key and the `data-orchestrator-guide-topic` value.
const GUIDE_TOPICS = [
	{
		id: 'stations',
		heading: 'The phase stations',
		body: 'The panel lays the notional machine out as stations from left to right — source, realm, parse, creation, evaluation — each with its own lens picker. The layout itself teaches the lifecycle: read the stages of the machine before choosing a lens, and the panel doubles as a display of how far your program got.',
	},
	{
		id: 'reveal-rules',
		heading: 'Why stations appear and grey out',
		body: 'Core stations (source and parse) are always shown. The language-level stations — realm, creation, evaluation — appear only when your code runs as a module and stays within the level; switching to script mode removes them, as does code that steps outside the level. Within the shown stations, any phase after the one that tripped greys out as unreachable, while source and realm never grey — they sit outside the failure path of the machine.',
	},
	{
		id: 'toggles',
		heading: 'The type and sandbox toggles',
		body: 'The type toggle re-embodies your buffer as a script or a module; its most visible effect is on the panel, because script mode hides the language-level stations (the dock shows an adjacent hint when module-admissible code sits in script mode). The sandbox toggle chooses where code runs: the sandboxed worker by default, or danger mode when an educator offers it.',
	},
	{
		id: 'limits',
		heading: 'The run limits',
		body: 'The seconds and iterations limits bound a run so a runaway loop cannot hang you. The worker enforces seconds with an outside clock and iterations with a loop guard; tripping either ends the run with a limit-exceeded outcome.',
	},
	{
		id: 'danger',
		heading: 'What danger mode risks',
		body: 'Danger mode runs your code in an iframe with the real window — native dialogs and the browser debugger — which the worker cannot give. The trade is real: a stuck danger run can freeze the page, so the name carries the consent, and an educator can switch danger off entirely.',
	},
] as const;

export default EmbeddedGuide;
