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
import type {
	ChannelKind,
	DockRunState,
	EndReportOutcome,
	RunLimits,
	SandboxMode,
} from '../types.js';

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

	/**
	 * The current execution sandbox — the sandbox toggle's value, surfaced as
	 * `data-orchestrator-dock-sandbox-toggle="worker|danger"`. The toggle is
	 * rendered ONLY when `dangerAvailable` (no danger position ⇒ no toggle).
	 */
	readonly sandboxMode: SandboxMode;

	/**
	 * Whether the danger sandbox is offered (an educator-level setting, seeded
	 * once at mount). When false the sandbox toggle is absent entirely — there is
	 * no danger position to flip to.
	 */
	readonly dangerAvailable: boolean;

	/**
	 * Whether the danger-only debugger is enabled — reflected on the debugger
	 * control's `checked` state. The debugger control shows only in danger mode.
	 */
	readonly debuggerEnabled: boolean;

	/** Called when the learner clicks the sandbox toggle (a flip; takes no argument). */
	readonly onSandboxToggle: () => void;

	/** Called when the learner toggles the danger-only debugger. */
	readonly onDebuggerToggle: () => void;

	/**
	 * The current run limits (seconds + iterations) — each surfaced as a
	 * value-bearing `data-orchestrator-dock-limit="seconds|iterations"` input.
	 */
	readonly runLimits: RunLimits;

	/** Called when the learner edits a run-limit input (field + the new number). */
	readonly onLimitChange: (
		field: 'seconds' | 'iterations',
		value: number,
	) => void;

	/**
	 * The run lifecycle's transport phase — surfaced as
	 * `data-orchestrator-dock-run-state="idle|running|settled"` ON the Run control.
	 * Orthogonal to `outcome`: `'settled'` collapses every terminal outcome into
	 * "the run resolved"; read `outcome` for HOW it ended.
	 */
	readonly runState: DockRunState;

	/**
	 * The terminal classification of the last run, or null before the first run
	 * settles — surfaced as `data-orchestrator-dock-outcome` (present ONLY when
	 * `runState === 'settled'`). Rendered VERBATIM; the dock never branches on it.
	 */
	readonly outcome: EndReportOutcome | null;

	/**
	 * The accumulated output lines per channel — each channel's lines render in a
	 * `data-orchestrator-dock-channel="user-interface|developer-console"` log region.
	 */
	readonly output: Readonly<Record<ChannelKind, readonly string[]>>;

	/** Called when the learner clicks the Run control (a kick; takes no argument). */
	readonly onRun: () => void;

	/** Called when the learner clicks the Cancel control (takes no argument). */
	readonly onCancel: () => void;
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
	sandboxMode,
	dangerAvailable,
	debuggerEnabled,
	onSandboxToggle,
	onDebuggerToggle,
	runLimits,
	onLimitChange,
	runState,
	outcome,
	output,
	onRun,
	onCancel,
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
				{dangerAvailable ? (
					<button
						type="button"
						data-orchestrator-dock-sandbox-toggle={sandboxMode}
						aria-label="toggle execution sandbox between worker and danger"
						onClick={onSandboxToggle}
					>
						{sandboxMode}
					</button>
				) : null}
				{dangerAvailable && sandboxMode === 'danger' ? (
					<input
						type="checkbox"
						data-orchestrator-dock-debugger
						aria-label="enable the debugger"
						checked={debuggerEnabled}
						onChange={onDebuggerToggle}
					/>
				) : null}
				<input
					type="number"
					data-orchestrator-dock-limit="seconds"
					aria-label="run time limit in seconds"
					value={runLimits.seconds}
					onChange={(event) =>
						onLimitChange('seconds', Number(event.target.value))
					}
				/>
				<input
					type="number"
					data-orchestrator-dock-limit="iterations"
					aria-label="run loop-iteration limit"
					value={runLimits.iterations}
					onChange={(event) =>
						onLimitChange('iterations', Number(event.target.value))
					}
				/>
			</div>
			<button
				type="button"
				data-orchestrator-dock-run
				data-orchestrator-dock-run-state={runState}
				aria-label="run the program"
				onClick={onRun}
			>
				Run
			</button>
			<button type="button" aria-label="cancel the run" onClick={onCancel}>
				Cancel
			</button>
			<div
				data-orchestrator-dock-channel="user-interface"
				role="log"
				aria-live="polite"
				aria-label="user-interface output"
			>
				{output['user-interface'].map((line, index) => (
					<div key={index}>{line}</div>
				))}
			</div>
			<div
				data-orchestrator-dock-channel="developer-console"
				role="log"
				aria-live="polite"
				aria-label="developer-console output"
			>
				{output['developer-console'].map((line, index) => (
					<div key={index}>{line}</div>
				))}
			</div>
			{runState === 'settled' && outcome !== null ? (
				<span data-orchestrator-dock-outcome={outcome}>{outcome}</span>
			) : null}
		</div>
	);
}

export default Dock;
