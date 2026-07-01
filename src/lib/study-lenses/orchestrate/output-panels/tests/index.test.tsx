// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
	InteractionAnswer,
	OutputPanelDismissal,
	PendingInteraction,
} from '../../types.js';
import OutputPanels from '../index.js';

afterEach(cleanup);

const EMPTY: Readonly<
	Record<'user-interface' | 'developer-console', readonly string[]>
> = Object.freeze({
	'user-interface': Object.freeze([]),
	'developer-console': Object.freeze([]),
});

const NONE_DISMISSED: OutputPanelDismissal = Object.freeze({
	'user-interface': false,
	'developer-console': false,
});

// `pending` / `onAnswer` / `dismissed` / `onDismiss` are required props (the
// orchestrator always supplies them). This helper defaults them (no pending,
// no-op answer, nothing dismissed) so the passive channel-rendering tests stay
// focused on `output` without per-site boilerplate.
function renderPanels(
	overrides: Partial<{
		output: Readonly<
			Record<'user-interface' | 'developer-console', readonly string[]>
		>;
		pending: PendingInteraction | null;
		onAnswer: (value: InteractionAnswer) => void;
		dismissed: OutputPanelDismissal;
		onDismiss: (channel: 'user-interface' | 'developer-console') => void;
	}> = {},
): ReturnType<typeof render> {
	return render(
		<OutputPanels
			output={overrides.output ?? EMPTY}
			pending={overrides.pending ?? null}
			onAnswer={overrides.onAnswer ?? (() => {})}
			dismissed={overrides.dismissed ?? NONE_DISMISSED}
			onDismiss={overrides.onDismiss ?? (() => {})}
		/>,
	);
}

describe('<OutputPanels>', () => {
	describe('Zero — the landmark + both channels mount', () => {
		it('renders the [data-orchestrator-output-panels] section landmark', () => {
			const { container } = renderPanels();
			expect(
				container.querySelector('[data-orchestrator-output-panels]')?.tagName,
			).toBe('SECTION');
		});

		it('renders both output channels with the renamed -output-channel selector', () => {
			const { container } = renderPanels();
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="user-interface"]',
				),
			).not.toBeNull();
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="developer-console"]',
				),
			).not.toBeNull();
		});

		it('does NOT carry the retired -dock-channel selector', () => {
			const { container } = renderPanels();
			expect(
				container.querySelector('[data-orchestrator-dock-channel]'),
			).toBeNull();
		});

		it('preserves the live-region a11y contract (role=log, aria-live, aria-label)', () => {
			const { container } = renderPanels();
			expect(
				container
					.querySelector('[data-orchestrator-output-panels]')
					?.getAttribute('aria-label'),
			).toBeTruthy();
			const ui = container.querySelector(
				'[data-orchestrator-output-channel="user-interface"]',
			);
			expect(ui?.getAttribute('role')).toBe('log');
			expect(ui?.getAttribute('aria-live')).toBe('polite');
			expect(ui?.getAttribute('aria-label')).toBeTruthy();
			const developerConsole = container.querySelector(
				'[data-orchestrator-output-channel="developer-console"]',
			);
			expect(developerConsole?.getAttribute('role')).toBe('log');
			expect(developerConsole?.getAttribute('aria-live')).toBe('polite');
		});

		it('renders the user-interface panel above the developer-console panel', () => {
			const { container } = renderPanels();
			const ui = container.querySelector(
				'[data-orchestrator-output-panel="user-interface"]',
			);
			const developerConsole = container.querySelector(
				'[data-orchestrator-output-panel="developer-console"]',
			);
			expect(ui?.nextElementSibling).toBe(developerConsole);
		});
	});

	describe('Many — the channels render their handed-in lines', () => {
		it('renders each user-interface line as a child node, in order', () => {
			const output = Object.freeze({
				'user-interface': Object.freeze(['dialog 1', 'dialog 2']),
				'developer-console': Object.freeze([]),
			});
			const { container } = renderPanels({ output });
			const channel = container.querySelector(
				'[data-orchestrator-output-channel="user-interface"]',
			);
			expect(channel?.children).toHaveLength(2);
			expect(channel?.children[0]?.textContent).toBe('dialog 1');
			expect(channel?.children[1]?.textContent).toBe('dialog 2');
		});

		it('renders developer-console lines independently of the user-interface channel', () => {
			const output = Object.freeze({
				'user-interface': Object.freeze([]),
				'developer-console': Object.freeze(['log a', 'log b', 'log c']),
			});
			const { container } = renderPanels({ output });
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="developer-console"]',
				)?.children,
			).toHaveLength(3);
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="user-interface"]',
				)?.children,
			).toHaveLength(0);
		});

		it("routes each channel's lines to its own panel (no cross-assignment)", () => {
			const output = Object.freeze({
				'user-interface': Object.freeze(['ui-only']),
				'developer-console': Object.freeze(['console-only']),
			});
			const { container } = renderPanels({ output });
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="user-interface"]',
				)?.children[0]?.textContent,
			).toBe('ui-only');
			expect(
				container.querySelector(
					'[data-orchestrator-output-channel="developer-console"]',
				)?.children[0]?.textContent,
			).toBe('console-only');
		});
	});
});

describe('<OutputPanels> — Interactive User Interface panel (pending dialog, inc 4)', () => {
	function renderInteractive(
		pending: PendingInteraction | null,
		onAnswer: (value: InteractionAnswer) => void = () => {},
		output: Readonly<
			Record<'user-interface' | 'developer-console', readonly string[]>
		> = EMPTY,
	): ReturnType<typeof render> {
		return renderPanels({ output, pending, onAnswer });
	}

	describe('Zero — no pending interaction', () => {
		it('renders no pending dialog when pending is null', () => {
			const { container } = renderInteractive(null);
			expect(
				container.querySelector('[data-orchestrator-pending-dialog]'),
			).toBeNull();
		});
	});

	describe('alert — message + OK only, returns undefined', () => {
		it('shows the message and an OK control, with no Cancel and no input', () => {
			const { container } = renderInteractive({
				kind: 'alert',
				message: 'heads up',
			});
			const dialog = container.querySelector(
				'[data-orchestrator-pending-dialog]',
			);
			expect(dialog).not.toBeNull();
			expect(dialog?.textContent).toContain('heads up');
			expect(
				container.querySelector('[data-orchestrator-pending-confirm]'),
			).not.toBeNull();
			expect(
				container.querySelector('[data-orchestrator-pending-cancel]'),
			).toBeNull();
			expect(
				container.querySelector('[data-orchestrator-pending-input]'),
			).toBeNull();
		});

		it('OK → onAnswer(undefined) (native alert returns void)', () => {
			const onAnswer = vi.fn();
			const { container } = renderInteractive(
				{ kind: 'alert', message: 'heads up' },
				onAnswer,
			);
			fireEvent.click(
				container.querySelector('[data-orchestrator-pending-confirm]')!,
			);
			expect(onAnswer).toHaveBeenCalledTimes(1);
			expect(onAnswer).toHaveBeenCalledWith(undefined);
		});
	});

	describe('confirm — OK / Cancel, returns boolean', () => {
		it('shows OK and Cancel and no input', () => {
			const { container } = renderInteractive({
				kind: 'confirm',
				message: 'proceed?',
			});
			expect(
				container.querySelector('[data-orchestrator-pending-confirm]'),
			).not.toBeNull();
			expect(
				container.querySelector('[data-orchestrator-pending-cancel]'),
			).not.toBeNull();
			expect(
				container.querySelector('[data-orchestrator-pending-input]'),
			).toBeNull();
		});

		it('OK → onAnswer(true)', () => {
			const onAnswer = vi.fn();
			const { container } = renderInteractive(
				{ kind: 'confirm', message: 'proceed?' },
				onAnswer,
			);
			fireEvent.click(
				container.querySelector('[data-orchestrator-pending-confirm]')!,
			);
			expect(onAnswer).toHaveBeenCalledWith(true);
		});

		it('Cancel → onAnswer(false)', () => {
			const onAnswer = vi.fn();
			const { container } = renderInteractive(
				{ kind: 'confirm', message: 'proceed?' },
				onAnswer,
			);
			fireEvent.click(
				container.querySelector('[data-orchestrator-pending-cancel]')!,
			);
			expect(onAnswer).toHaveBeenCalledWith(false);
		});
	});

	describe('prompt — input + OK / Cancel, returns string | null', () => {
		it('seeds the input with defaultValue and shows OK + Cancel', () => {
			const { container } = renderInteractive({
				kind: 'prompt',
				message: 'name?',
				defaultValue: 'seed',
			});
			const input = container.querySelector<HTMLInputElement>(
				'[data-orchestrator-pending-input]',
			);
			expect(input).not.toBeNull();
			expect(input?.value).toBe('seed');
			expect(
				container.querySelector('[data-orchestrator-pending-cancel]'),
			).not.toBeNull();
		});

		it('seeds an empty input when no defaultValue is given', () => {
			const { container } = renderInteractive({
				kind: 'prompt',
				message: 'name?',
			});
			const input = container.querySelector<HTMLInputElement>(
				'[data-orchestrator-pending-input]',
			);
			expect(input).not.toBeNull();
			expect(input?.value).toBe('');
		});

		it('typing then OK → onAnswer(the current input value)', () => {
			const onAnswer = vi.fn();
			const { container } = renderInteractive(
				{ kind: 'prompt', message: 'name?', defaultValue: 'seed' },
				onAnswer,
			);
			const input = container.querySelector<HTMLInputElement>(
				'[data-orchestrator-pending-input]',
			);
			expect(input).not.toBeNull();
			fireEvent.change(input!, { target: { value: 'Ada' } });
			fireEvent.click(
				container.querySelector('[data-orchestrator-pending-confirm]')!,
			);
			expect(onAnswer).toHaveBeenCalledWith('Ada');
		});

		it('Cancel → onAnswer(null)', () => {
			const onAnswer = vi.fn();
			const { container } = renderInteractive(
				{ kind: 'prompt', message: 'name?', defaultValue: 'seed' },
				onAnswer,
			);
			const cancel = container.querySelector(
				'[data-orchestrator-pending-cancel]',
			);
			expect(cancel).not.toBeNull();
			fireEvent.click(cancel!);
			expect(onAnswer).toHaveBeenCalledWith(null);
		});
	});

	describe('Placement — the dialog never disturbs the channel log structure', () => {
		it('keeps the user-interface panel directly before developer-console, and the dialog is NOT inside the UI log', () => {
			const output = Object.freeze({
				'user-interface': Object.freeze(['line a']),
				'developer-console': Object.freeze([]),
			});
			const { container } = renderInteractive(
				{ kind: 'confirm', message: 'proceed?' },
				() => {},
				output,
			);
			// panels stay ordered UI-above-console; the dialog renders AFTER both
			// panels, so the UI panel's immediate sibling is still the dev panel.
			const userInterfacePanel = container.querySelector(
				'[data-orchestrator-output-panel="user-interface"]',
			);
			const developerConsolePanel = container.querySelector(
				'[data-orchestrator-output-panel="developer-console"]',
			);
			expect(userInterfacePanel?.nextElementSibling).toBe(
				developerConsolePanel,
			);
			// the UI log holds only its lines — the dialog is not inside it
			const uiLog = container.querySelector(
				'[data-orchestrator-output-channel="user-interface"]',
			);
			expect(uiLog?.childElementCount).toBe(1);
			expect(
				uiLog?.querySelector('[data-orchestrator-pending-dialog]'),
			).toBeNull();
		});
	});
});

describe('<OutputPanels> — per-panel dismissal (inc 5)', () => {
	function renderDismissable(
		dismissed: OutputPanelDismissal,
		onDismiss: (
			channel: 'user-interface' | 'developer-console',
		) => void = () => {},
		pending: PendingInteraction | null = null,
	): ReturnType<typeof render> {
		return render(
			<OutputPanels
				output={EMPTY}
				pending={pending}
				onAnswer={() => {}}
				dismissed={dismissed}
				onDismiss={onDismiss}
			/>,
		);
	}

	it('renders a dismiss control for each channel', () => {
		const { container } = renderDismissable(NONE_DISMISSED);
		expect(
			container.querySelector(
				'[data-orchestrator-output-panel-dismiss="user-interface"]',
			),
		).not.toBeNull();
		expect(
			container.querySelector(
				'[data-orchestrator-output-panel-dismiss="developer-console"]',
			),
		).not.toBeNull();
	});

	it('does not render a channel panel that is dismissed (the other stays)', () => {
		const { container } = renderDismissable(
			Object.freeze({ 'user-interface': true, 'developer-console': false }),
		);
		expect(
			container.querySelector(
				'[data-orchestrator-output-channel="user-interface"]',
			),
		).toBeNull();
		expect(
			container.querySelector(
				'[data-orchestrator-output-channel="developer-console"]',
			),
		).not.toBeNull();
	});

	it('clicking a channel dismiss control routes onDismiss(channel)', () => {
		const onDismiss = vi.fn();
		const { container } = renderDismissable(NONE_DISMISSED, onDismiss);
		fireEvent.click(
			container.querySelector(
				'[data-orchestrator-output-panel-dismiss="developer-console"]',
			)!,
		);
		expect(onDismiss).toHaveBeenCalledWith('developer-console');
	});

	it('clicking the user-interface dismiss control routes onDismiss("user-interface")', () => {
		const onDismiss = vi.fn();
		const { container } = renderDismissable(NONE_DISMISSED, onDismiss);
		const dismiss = container.querySelector(
			'[data-orchestrator-output-panel-dismiss="user-interface"]',
		);
		expect(dismiss).not.toBeNull();
		fireEvent.click(dismiss!);
		// triangulates channel identity through the callback (not a hardcoded value)
		expect(onDismiss).toHaveBeenCalledWith('user-interface');
	});

	it('keeps the panels root present when BOTH channels are dismissed (both panels absent)', () => {
		const { container } = renderDismissable(
			Object.freeze({ 'user-interface': true, 'developer-console': true }),
		);
		// the root section stays (the active surface fills the row via CSS, not DOM
		// removal — see parent README § The output panels); both channel logs go.
		expect(
			container.querySelector('[data-orchestrator-output-panels]'),
		).not.toBeNull();
		expect(
			container.querySelector(
				'[data-orchestrator-output-channel="user-interface"]',
			),
		).toBeNull();
		expect(
			container.querySelector(
				'[data-orchestrator-output-channel="developer-console"]',
			),
		).toBeNull();
	});

	it('suppresses the user-interface dismiss control while a dialog is pending (modal)', () => {
		const { container } = renderDismissable(NONE_DISMISSED, () => {}, {
			kind: 'confirm',
			message: 'proceed?',
		});
		// modal: the UI panel cannot be dismissed while it is asking a question…
		expect(
			container.querySelector(
				'[data-orchestrator-output-panel-dismiss="user-interface"]',
			),
		).toBeNull();
		// …but the passive developer-console panel stays dismissable.
		expect(
			container.querySelector(
				'[data-orchestrator-output-panel-dismiss="developer-console"]',
			),
		).not.toBeNull();
	});

	it('keeps the pending dialog answerable even when BOTH channel panels are dismissed', () => {
		// inc4 × inc5 composition: a learner can dismiss the UI panel while idle,
		// then the run fires confirm/prompt. The dialog renders OUTSIDE the
		// dismissal guard, so it stays answerable — the run can never be stranded.
		const { container } = renderDismissable(
			Object.freeze({ 'user-interface': true, 'developer-console': true }),
			() => {},
			{ kind: 'confirm', message: 'proceed?' },
		);
		expect(
			container.querySelector('[data-orchestrator-pending-dialog]'),
		).not.toBeNull();
		expect(
			container.querySelector('[data-orchestrator-pending-confirm]'),
		).not.toBeNull();
		expect(
			container.querySelector('[data-orchestrator-pending-cancel]'),
		).not.toBeNull();
	});
});
