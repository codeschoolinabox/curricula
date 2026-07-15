/**
 * @file `<OutputPanels>` — the content-row's run-output surface: the two NM I/O
 * channels rendered as panels **beside** the active surface (User Interface on
 * top, Developer Console below), enforcing the user-audience vs dev-audience
 * split. **Presentation only.** The orchestrator ([`../index.tsx`](../index.tsx))
 * owns the run lifecycle, the accumulated `channelOutput`, the pending-interaction
 * slot (its displayable fields arrive here as `pending`; the awaited run's
 * resolver lives in an orchestrator ref, never here), and the dismissal state;
 * this module renders what it is handed and routes the learner's answer up
 * through `onAnswer`. It imports no `embody`, dispatches no bus events, and holds
 * no orchestrator state — it never sees the `Snippet`, and it cannot deadlock the
 * worker (it has no resolver to drop).
 *
 * This module took the two output channels OUT of the dock (the dock is now a
 * controls-only surface). The selector renamed with the move:
 * `data-orchestrator-dock-channel` → `data-orchestrator-output-channel` (the
 * `dock-` prefix asserted a containment that is no longer true; the value-space
 * is still `ChannelKind`).
 *
 * The **User Interface** panel is **interactive and a faithful match for the
 * native dialogs**. When a run's `alert` / `confirm` / `prompt` is awaiting an
 * answer, the orchestrator sets `pending` and this panel renders the dialog
 * (after the two channel logs — never inside them, so the logs' child structure
 * is untouched) and routes the answer up per-kind, exactly like the natives:
 *
 * - `alert(message)`   → message + **OK** → `onAnswer(undefined)` (returns void).
 * - `confirm(message)` → message + **OK** / **Cancel** → `onAnswer(true | false)`.
 * - `prompt(message, default?)` → message + input (uncontrolled, seeded with
 *   `default`, read on OK) + **OK** / **Cancel** → `onAnswer(value | null)`.
 *
 * The dialog's message is ALSO appended to the user-interface channel log by the
 * orchestrator's io mock (the transcript) — the panel renders both `output` and
 * `pending`.
 *
 * Selector contract (locked — [`../README.md` § The output panels](../README.md)):
 * `data-orchestrator-output-panels` on the root `<section>`;
 * `data-orchestrator-output-channel="user-interface|developer-console"` per log;
 * `data-orchestrator-pending-dialog` on the interaction, with
 * `data-orchestrator-pending-input` (prompt only),
 * `data-orchestrator-pending-confirm` (OK) and `data-orchestrator-pending-cancel`
 * (Cancel) on its controls. Tests anchor on attribute + value, never label text.
 *
 * This module renders per-panel **dismissal** (the ✕, with this panel's ✕
 * suppressed while a dialog is pending — modal). **Appear-on-run** (mount only
 * while `runState !== 'idle'`) is the orchestrator's conditional render of this
 * component, not this module's concern.
 */

import React from 'react';

import Splitter from '../splitter/index.jsx';
import type {
	ChannelKind,
	InteractionAnswer,
	OutputPanelDismissal,
	PendingInteraction,
} from '../types.js';

/**
 * The answer the **OK** control sends, by kind: `confirm` → `true`; `prompt` →
 * the input's current value (uncontrolled — read from the live node on click);
 * `alert` → `undefined` (native `alert` returns void; the orchestrator's resolver
 * ignores the value and just resumes the run). **Cancel** is handled inline (it
 * sends `false` for `confirm`, `null` for `prompt`).
 */
function okAnswer(
	pending: PendingInteraction,
	promptInput: HTMLInputElement | null,
): InteractionAnswer {
	if (pending.kind === 'confirm') return true;
	if (pending.kind === 'prompt') return promptInput?.value ?? '';
	// alert's answer IS undefined (mirrors window.alert's void return); the
	// orchestrator's alert resolver ignores the value and just resumes the run.
	return undefined;
}

type OutputPanelsProperties = Readonly<{
	/**
	 * The accumulated output lines per channel — the orchestrator's
	 * `channelOutput` state. Each channel's lines render in their
	 * `data-orchestrator-output-channel="<ChannelKind>"` log region.
	 */
	readonly output: Readonly<Record<ChannelKind, readonly string[]>>;
	/**
	 * The current pending interactive IO request (`alert` / `confirm` / `prompt`)
	 * or `null` when nothing is awaiting an answer. Rendered as the dialog after
	 * the channel logs; modal in spirit (answered via its own controls).
	 */
	readonly pending: PendingInteraction | null;
	/**
	 * Routes the learner's answer to the pending interaction up to the
	 * orchestrator, which resolves the awaited run Promise and clears `pending`.
	 * Per-kind value: `alert` → `undefined`; `confirm` → `boolean`; `prompt` →
	 * `string | null`.
	 */
	readonly onAnswer: (value: InteractionAnswer) => void;
	/**
	 * Per-channel dismissal flags. A channel whose flag is `true` is not rendered
	 * (its panel + log + ✕ are absent); the panels-root `<section>` stays so the
	 * active surface fills the row via CSS, not DOM removal.
	 */
	readonly dismissed: OutputPanelDismissal;
	/**
	 * Dismiss one channel's panel (the per-panel ✕), routed to the orchestrator.
	 * The User Interface panel's ✕ is suppressed while a dialog is pending (modal),
	 * so this is never called for `'user-interface'` mid-interaction.
	 */
	readonly onDismiss: (channel: ChannelKind) => void;
}>;

/**
 * Renders the output panels: the User Interface panel (top) and the Developer
 * Console panel (bottom). Each channel is a `data-orchestrator-output-panel`
 * wrapper holding a per-panel ✕ (dismiss control) and a `role="log"` region of
 * the handed-in lines; a dismissed channel's whole panel is absent. When
 * `pending !== null` the interactive dialog renders AFTER both panels (never
 * inside a channel log), and the User Interface ✕ is suppressed (modal). A pure
 * function of its props; the prompt input is uncontrolled (seeded from
 * `defaultValue`, read from the ref on OK), so no per-keystroke state is held.
 */
function OutputPanels({
	output,
	pending,
	onAnswer,
	dismissed,
	onDismiss,
}: OutputPanelsProperties): React.JSX.Element {
	const promptInputReference = React.useRef<HTMLInputElement>(null);
	return (
		<section data-orchestrator-output-panels aria-label="program output">
			<Splitter
				orientation="column"
				sizedPane="first"
				resizeMode="proportional"
				defaultBasisPx={200}
				minPx={96}
				maxPx={1200}
				maxFraction={0.75}
				stepPx={16}
				label="resize the user interface and the developer console"
				first={
					dismissed['user-interface'] ? null : (
						<div data-orchestrator-output-panel="user-interface">
							{pending === null ? (
								<button
									type="button"
									data-orchestrator-output-panel-dismiss="user-interface"
									aria-label="dismiss user-interface panel"
									onClick={() => onDismiss('user-interface')}
								>
									✕
								</button>
							) : null}
							<div
								data-orchestrator-output-channel="user-interface"
								role="log"
								aria-live="polite"
								aria-label="user-interface output"
							>
								{output['user-interface'].map((line, index) => (
									<div key={index}>{line}</div>
								))}
							</div>
						</div>
					)
				}
				second={
					dismissed['developer-console'] ? null : (
						<div data-orchestrator-output-panel="developer-console">
							<button
								type="button"
								data-orchestrator-output-panel-dismiss="developer-console"
								aria-label="dismiss developer-console panel"
								onClick={() => onDismiss('developer-console')}
							>
								✕
							</button>
							<div
								data-orchestrator-output-channel="developer-console"
								role="log"
								aria-live="polite"
								aria-label="developer-console output"
							>
								{output['developer-console'].map((line, index) => (
									<div key={index}>{line}</div>
								))}
							</div>
						</div>
					)
				}
			/>
			{pending === null ? null : (
				<div
					data-orchestrator-pending-dialog
					role="group"
					aria-label="program interaction"
				>
					<p>{pending.message}</p>
					{pending.kind === 'prompt' ? (
						<input
							ref={promptInputReference}
							data-orchestrator-pending-input
							aria-label="interaction response"
							defaultValue={pending.defaultValue ?? ''}
						/>
					) : null}
					<button
						type="button"
						data-orchestrator-pending-confirm
						onClick={() =>
							onAnswer(okAnswer(pending, promptInputReference.current))
						}
					>
						OK
					</button>
					{pending.kind === 'alert' ? null : (
						<button
							type="button"
							data-orchestrator-pending-cancel
							onClick={() =>
								onAnswer(pending.kind === 'confirm' ? false : null)
							}
						>
							Cancel
						</button>
					)}
				</div>
			)}
		</section>
	);
}

export default OutputPanels;
