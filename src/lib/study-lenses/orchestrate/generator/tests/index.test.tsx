// @vitest-environment jsdom

import {
	act,
	cleanup,
	fireEvent,
	render,
	waitFor,
} from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import GeneratorView from '../index.jsx';
import type { GeneratorSocket } from '../types.js';

import { abortableSocket, scriptedSocket, unaskedSocket } from './fakes.js';

afterEach(cleanup);

function mountOver(
	seed: string,
	socket: GeneratorSocket = unaskedSocket(),
	{ onAccept = vi.fn(), onDiscard = vi.fn() }: MountIntents = {},
): HTMLElement {
	const { container } = render(
		<React.StrictMode>
			<GeneratorView
				onAccept={onAccept}
				onDiscard={onDiscard}
				seed={seed}
				socket={socket}
			/>
		</React.StrictMode>,
	);
	return container;
}

// The spies are destructured in the signature, never defaulted at the JSX site:
// StrictMode re-renders, and a fresh `vi.fn()` per render would leave the test
// holding a spy the view never called.
type MountIntents = {
	readonly onAccept?: (program: string) => void;
	readonly onDiscard?: () => void;
};

function querySeed(container: HTMLElement): HTMLElement | null {
	return container.querySelector<HTMLElement>(
		'[data-generator] [data-generator-seed]',
	);
}

function queryPrompt(container: HTMLElement): HTMLTextAreaElement | null {
	return container.querySelector<HTMLTextAreaElement>(
		'[data-generator] [data-generator-prompt]',
	);
}

function queryAsk(container: HTMLElement): HTMLButtonElement | null {
	return container.querySelector<HTMLButtonElement>(
		'[data-generator] [data-generator-generate]',
	);
}

function queryOutput(container: HTMLElement): HTMLElement | null {
	return container.querySelector<HTMLElement>(
		'[data-generator] [data-generator-output]',
	);
}

function queryPreview(container: HTMLElement): HTMLElement | null {
	return container.querySelector<HTMLElement>(
		'[data-generator] [data-generator-preview]',
	);
}

function queryMeta(container: HTMLElement): HTMLElement | null {
	return container.querySelector<HTMLElement>(
		'[data-generator] [data-generator-meta]',
	);
}

function queryRefusal(container: HTMLElement): HTMLElement | null {
	return container.querySelector<HTMLElement>(
		'[data-generator] [data-generator-refusal]',
	);
}

function queryCancel(container: HTMLElement): HTMLButtonElement | null {
	return container.querySelector<HTMLButtonElement>(
		'[data-generator] [data-generator-cancel]',
	);
}

function queryAccept(container: HTMLElement): HTMLButtonElement | null {
	return container.querySelector<HTMLButtonElement>(
		'[data-generator] [data-generator-accept]',
	);
}

function queryDiscard(container: HTMLElement): HTMLButtonElement | null {
	return container.querySelector<HTMLButtonElement>(
		'[data-generator] [data-generator-discard]',
	);
}

function writePrompt(container: HTMLElement, text: string): void {
	const field = queryPrompt(container);
	if (!field) throw new Error('missing the prompt field');
	fireEvent.change(field, { target: { value: text } });
}

function clickAsk(container: HTMLElement): void {
	const affordance = queryAsk(container);
	if (!affordance) throw new Error('missing the ask affordance');
	fireEvent.click(affordance);
}

function clickCancel(container: HTMLElement): void {
	const control = queryCancel(container);
	if (!control) throw new Error('missing the reset control');
	fireEvent.click(control);
}

function clickAccept(container: HTMLElement): void {
	const control = queryAccept(container);
	if (!control) throw new Error('missing the accept control');
	fireEvent.click(control);
}

function clickDiscard(container: HTMLElement): void {
	const control = queryDiscard(container);
	if (!control) throw new Error('missing the discard control');
	fireEvent.click(control);
}

describe('GeneratorView', () => {
	describe('the empty mount (Zero)', () => {
		it('renders the view root', () => {
			const container = mountOver('');
			expect(container.querySelector('[data-generator]')).not.toBeNull();
		});

		it('seats an empty seed as an empty slot', () => {
			expect(querySeed(mountOver(''))?.textContent).toBe('');
		});

		it('offers no live ask over an empty prompt and an empty seed', () => {
			expect(queryAsk(mountOver(''))?.disabled).toBe(true);
		});

		it('warns that generating takes a while', () => {
			expect(mountOver('').textContent).toMatch(/takes? a while|slow/i);
		});

		it('warns that leaving the view ends the generation', () => {
			expect(mountOver('').textContent).toMatch(/leaving this view ends/i);
		});
	});

	describe('one seed, one prompt (One)', () => {
		it('seats a one-line seed verbatim', () => {
			expect(querySeed(mountOver('let x = 1;'))?.textContent).toBe(
				'let x = 1;',
			);
		});

		it('a seed alone is enough to ask', () => {
			expect(queryAsk(mountOver('let x = 1;'))?.disabled).toBe(false);
		});

		it('a prompt alone is enough to ask', () => {
			const container = mountOver('');
			writePrompt(container, 'write me a loop');
			expect(queryAsk(container)?.disabled).toBe(false);
		});
	});

	describe('more to work from (Many)', () => {
		it('seats a multi-line seed verbatim', () => {
			expect(querySeed(mountOver('let a = 1;\nlet b = 2;'))?.textContent).toBe(
				'let a = 1;\nlet b = 2;',
			);
		});

		it('a seed and a prompt together are enough to ask', () => {
			const container = mountOver('let x = 1;');
			writePrompt(container, 'add a second');
			expect(queryAsk(container)?.disabled).toBe(false);
		});
	});

	describe('the edges of having something to ask (Boundaries)', () => {
		// PINNED(AR-3 2026-07-30: whitespace-only seed/prompt is non-empty,
		// matching the socket's already-ruled asymmetry)
		it('a whitespace-only prompt is something to ask about', () => {
			const container = mountOver('');
			writePrompt(container, '   ');
			expect(queryAsk(container)?.disabled).toBe(false);
		});

		// PINNED(AR-3 2026-07-30: whitespace-only seed/prompt is non-empty,
		// matching the socket's already-ruled asymmetry)
		it('a whitespace-only seed is something to ask about', () => {
			expect(queryAsk(mountOver('   '))?.disabled).toBe(false);
		});

		it('clearing the prompt over an empty seed retires the ask again', () => {
			const container = mountOver('');
			writePrompt(container, 'write me a loop');
			writePrompt(container, '');
			expect(queryAsk(container)?.disabled).toBe(true);
		});
	});

	describe('the mount surface (Interfaces)', () => {
		it('seats the seed in a pre, so its whitespace survives without CSS', () => {
			expect(querySeed(mountOver('  indented'))?.tagName).toBe('PRE');
		});

		it('takes the prompt in a textarea, so a prompt can hold a newline', () => {
			expect(queryPrompt(mountOver(''))?.tagName).toBe('TEXTAREA');
		});

		it('starts the prompt empty even over a seed', () => {
			expect(queryPrompt(mountOver('let x = 1;'))?.value).toBe('');
		});

		it('keeps the warning up over a seed, not only at an empty mount', () => {
			expect(mountOver('let x = 1;').textContent).toMatch(
				/takes? a while|slow/i,
			);
		});

		it('offers the prompt as the only thing the learner can write in', () => {
			const container = mountOver('let x = 1;');
			const writable = Array.from(
				container.querySelectorAll<HTMLElement>(
					'[data-generator] textarea, [data-generator] input',
				),
				(control) => control.dataset.generatorPrompt !== undefined,
			);
			expect(writable).toEqual([true]);
		});

		it('names the prompt field for assistive tech', () => {
			const named = queryPrompt(mountOver(''))?.closest('label')?.textContent;
			expect((named ?? '').trim().length).toBeGreaterThan(0);
		});

		it('labels the ask affordance Generate', () => {
			expect(queryAsk(mountOver(''))?.textContent).toBe('Generate');
		});

		it('adds no heading to the instrument, at any level', () => {
			const container = mountOver('let x = 1;');
			expect(
				container.querySelector(
					'[data-generator] h1, [data-generator] h2, [data-generator] h3, [data-generator] h4, [data-generator] h5, [data-generator] h6',
				),
			).toBeNull();
		});

		it('shows no output slot while the job is idle', () => {
			const container = mountOver('let x = 1;');
			expect(
				container.querySelector('[data-generator] [data-generator-output]'),
			).toBeNull();
		});

		it('offers no reset control while the job is idle', () => {
			const container = mountOver('let x = 1;');
			expect(
				container.querySelector('[data-generator] [data-generator-cancel]'),
			).toBeNull();
		});
	});

	describe('writing a prompt (Simple)', () => {
		it('keeps what the learner writes in the prompt field', () => {
			const container = mountOver('');
			writePrompt(container, 'vary this program');
			expect(queryPrompt(container)?.value).toBe('vary this program');
		});
	});

	describe('an ask leaves (Zero)', () => {
		it('asking opens the output slot', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading'] }),
			);
			clickAsk(container);
			expect(queryOutput(container)).not.toBeNull();
		});

		// PINNED(AR-3 2026-08-03: the slot follows the announcement, never the
		// click — without this a hasAsked flag passes the whole suite)
		it('a click the socket has not answered for leaves the slot closed', () => {
			const container = mountOver('let x = 1;', scriptedSocket());
			clickAsk(container);
			expect(queryOutput(container)).toBeNull();
		});
	});

	describe('one stage, then one candidate (One)', () => {
		it('reports bring-up while the socket is bringing up', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading'] }),
			);
			clickAsk(container);
			expect(queryOutput(container)?.textContent).toBe(
				'Getting the generator ready…',
			);
		});

		it('reports drafting once the socket announces it', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading', 'generating'] }),
			);
			clickAsk(container);
			expect(queryOutput(container)?.textContent).toBe('Writing a program…');
		});

		it('renders the candidate in the preview slot', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)?.textContent).toBe('let x = 2;');
			});
		});

		it('names the producer beside the candidate', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryMeta(container)?.textContent).toBe(
					'Produced by nano-3 in 1 attempt.',
				);
			});
		});
	});

	describe('both stages, then the answer (Many)', () => {
		it('replaces the bring-up report rather than stacking a second line', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading', 'generating'] }),
			);
			clickAsk(container);
			expect(queryOutput(container)?.textContent).not.toContain(
				'Getting the generator ready',
			);
		});

		it('drops the stage report once a candidate is on screen', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryOutput(container)?.textContent).not.toContain(
					'Writing a program',
				);
			});
		});
	});

	describe('the edges of one ask (Boundaries)', () => {
		it('spends the ask affordance while an ask is live', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading'] }),
			);
			clickAsk(container);
			expect(queryAsk(container)?.disabled).toBe(true);
		});

		it('arms the ask affordance again once a candidate is on screen', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryAsk(container)?.disabled).toBe(false);
			});
		});

		it('arms the ask affordance again once a refusal is on screen', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: false, refusal: { cause: 'no-model-available' } },
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryAsk(container)?.disabled).toBe(false);
			});
		});

		it('an empty candidate is still a candidate, not a violation', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: '',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
		});

		it('more than one pass reads as attempts', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 3 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryMeta(container)?.textContent).toBe(
					'Produced by nano-3 in 3 attempts.',
				);
			});
		});

		it('a refusal out of bring-up renders without ever drafting', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading'],
					answers: { ok: false, refusal: { cause: 'no-model-available' } },
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryRefusal(container)).not.toBeNull();
			});
		});
	});

	describe('what crosses the seam (Interfaces)', () => {
		it('hands the socket the seed as the program to work from', () => {
			const generate = vi.fn(scriptedSocket().generate);
			const container = mountOver('let x = 1;', { generate });
			clickAsk(container);
			expect(generate.mock.calls[0]?.[0]).toBe('let x = 1;');
		});

		it("hands the socket the learner's prompt", () => {
			const generate = vi.fn(scriptedSocket().generate);
			const container = mountOver('let x = 1;', { generate });
			writePrompt(container, 'add a loop');
			clickAsk(container);
			expect(generate.mock.calls[0]?.[1].prompt).toBe('add a loop');
		});

		it('asks for no particular model', () => {
			const generate = vi.fn(scriptedSocket().generate);
			const container = mountOver('let x = 1;', { generate });
			clickAsk(container);
			expect(generate.mock.calls[0]?.[1].model).toBe('');
		});

		it('hands the socket a way to announce its stages', () => {
			const generate = vi.fn(scriptedSocket().generate);
			const container = mountOver('let x = 1;', { generate });
			clickAsk(container);
			expect(typeof generate.mock.calls[0]?.[2]?.onPhase).toBe('function');
		});

		it('an empty prompt over a seed is still an ask', () => {
			const generate = vi.fn(scriptedSocket().generate);
			const container = mountOver('let x = 1;', { generate });
			clickAsk(container);
			expect(generate.mock.calls[0]?.[1].prompt).toBe('');
		});

		it('seats the candidate inside the output slot', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryOutput(container)?.contains(queryPreview(container))).toBe(
					true,
				);
			});
		});

		it('seats the meta line inside the output slot', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryOutput(container)?.contains(queryMeta(container))).toBe(
					true,
				);
			});
		});

		it('seats the refusal inside the output slot', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: false, refusal: { cause: 'no-model-available' } },
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryOutput(container)?.contains(queryRefusal(container))).toBe(
					true,
				);
			});
		});

		it('names the placeholder as a producer like any other', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'placeholder', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryMeta(container)?.textContent).toBe(
					'Produced by placeholder in 1 attempt.',
				);
			});
		});

		it('adds no heading to the instrument over a candidate either', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
			expect(
				container.querySelector(
					'[data-generator] h1, [data-generator] h2, [data-generator] h3, [data-generator] h4, [data-generator] h5, [data-generator] h6',
				),
			).toBeNull();
		});
	});

	describe('an answer the result shape cannot serve (Exceptions)', () => {
		it('a candidate carrying no program is an invariant violation', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: true, meta: { model: 'nano-3', attempts: 1 } },
				}),
			);
			clickAsk(container);
			await expect(async () => {
				await act(async () => {
					await Promise.resolve();
				});
			}).rejects.toThrow(
				'generator invariant violated: a candidate carried no program',
			);
		});

		it('a candidate naming no producer is an invariant violation', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: true, program: 'let x = 2;' },
				}),
			);
			clickAsk(container);
			await expect(async () => {
				await act(async () => {
					await Promise.resolve();
				});
			}).rejects.toThrow(
				'generator invariant violated: a candidate named no producer',
			);
		});

		it('a refusal carrying no cause is an invariant violation', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: false },
				}),
			);
			clickAsk(container);
			await expect(async () => {
				await act(async () => {
					await Promise.resolve();
				});
			}).rejects.toThrow(
				'generator invariant violated: a refusal carried no cause',
			);
		});
	});

	describe('the refusal in learner words (Simple)', () => {
		it.each([
			[
				'attempt-bound-exhausted',
				"The generator tried a few times but couldn't make a program that fits — adjust the prompt and ask again.",
			],
			['no-model-available', 'No model can run here right now.'],
			[
				'unknown-model',
				"The generator doesn't know the model that was asked for.",
			],
		] as const)('%s reads as one learner sentence', async (cause, sentence) => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: false, refusal: { cause } },
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryRefusal(container)?.textContent).toBe(sentence);
			});
		});

		it.each([
			['retry', 'Try again.'],
			[
				'free-space',
				'Your device is low on storage — free some space and try again.',
			],
			[
				'reconnect',
				"The model couldn't download — check your connection and try again.",
			],
			[
				'use-native-app',
				"This device can't run a model inside a web browser — a desktop app can.",
			],
		] as const)('%s rides along as its own line', async (nextStep, line) => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: false,
						refusal: { cause: 'no-model-available', nextStep },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryRefusal(container)?.textContent).toContain(line);
			});
		});
	});

	describe('the ask retired (Zero)', () => {
		it('stopping an ask closes the output slot again', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading'] }),
			);
			clickAsk(container);
			clickCancel(container);
			expect(queryOutput(container)).toBeNull();
		});

		it('stopping an ask arms the ask affordance again', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading'] }),
			);
			clickAsk(container);
			clickCancel(container);
			expect(queryAsk(container)?.disabled).toBe(false);
		});
	});

	describe('one answer, one way out (One)', () => {
		it('accepting raises the candidate upward', async () => {
			const onAccept = vi.fn();
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
				{ onAccept },
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
			clickAccept(container);
			expect(onAccept).toHaveBeenCalledWith('let x = 2;');
		});

		it('discarding a candidate raises the return home', async () => {
			const onDiscard = vi.fn();
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
				{ onDiscard },
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
			clickDiscard(container);
			expect(onDiscard).toHaveBeenCalledTimes(1);
		});
	});

	describe('every way one ask can end (Many)', () => {
		it('discarding a refusal raises the return home too', async () => {
			const onDiscard = vi.fn();
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: false, refusal: { cause: 'no-model-available' } },
				}),
				{ onDiscard },
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryRefusal(container)).not.toBeNull();
			});
			clickDiscard(container);
			expect(onDiscard).toHaveBeenCalledTimes(1);
		});

		it('starting over from a candidate closes the output slot', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
			clickCancel(container);
			expect(queryOutput(container)).toBeNull();
		});

		it('starting over from a refusal closes the output slot', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: false, refusal: { cause: 'no-model-available' } },
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryRefusal(container)).not.toBeNull();
			});
			clickCancel(container);
			expect(queryOutput(container)).toBeNull();
		});

		it('stopping mid-drafting closes the output slot', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading', 'generating'] }),
			);
			clickAsk(container);
			clickCancel(container);
			expect(queryOutput(container)).toBeNull();
		});
	});

	describe('the edges of one retirement (Boundaries)', () => {
		it('stopping keeps the prompt the learner wrote', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading'] }),
			);
			writePrompt(container, 'vary this program');
			clickAsk(container);
			clickCancel(container);
			expect(queryPrompt(container)?.value).toBe('vary this program');
		});

		it('stopping raises no accept', async () => {
			const onAccept = vi.fn();
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
				{ onAccept },
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
			clickCancel(container);
			expect(onAccept).not.toHaveBeenCalled();
		});

		it('stopping raises no discard', async () => {
			const onDiscard = vi.fn();
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
				{ onDiscard },
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
			clickCancel(container);
			expect(onDiscard).not.toHaveBeenCalled();
		});

		it('accepting an empty candidate raises the empty program', async () => {
			const onAccept = vi.fn();
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: '',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
				{ onAccept },
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
			clickAccept(container);
			expect(onAccept).toHaveBeenCalledWith('');
		});

		// PINNED(maintainer 2026-07-28: cancel owns the reset — discard raises the
		// return home and leaves the refusal standing)
		it('discarding leaves the refusal standing', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: false, refusal: { cause: 'no-model-available' } },
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryRefusal(container)).not.toBeNull();
			});
			clickDiscard(container);
			expect(queryRefusal(container)).not.toBeNull();
		});

		it('offers no accept control while the job is idle', () => {
			expect(queryAccept(mountOver('let x = 1;'))).toBeNull();
		});

		it('offers no discard control while the job is idle', () => {
			expect(queryDiscard(mountOver('let x = 1;'))).toBeNull();
		});

		it('offers no accept control while an ask is in flight', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading'] }),
			);
			clickAsk(container);
			expect(queryAccept(container)).toBeNull();
		});

		it('offers no discard control while an ask is in flight', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading'] }),
			);
			clickAsk(container);
			expect(queryDiscard(container)).toBeNull();
		});

		it('offers no accept control over a refusal', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: false, refusal: { cause: 'no-model-available' } },
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryRefusal(container)).not.toBeNull();
			});
			expect(queryAccept(container)).toBeNull();
		});
	});

	describe('what the retirement reaches (Interfaces)', () => {
		it('labels the reset control Stop while an ask is in flight', () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({ announces: ['loading'] }),
			);
			clickAsk(container);
			expect(queryCancel(container)?.textContent).toBe('Stop');
		});

		it('labels the reset control Start over once a candidate is on screen', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
			expect(queryCancel(container)?.textContent).toBe('Start over');
		});

		it('labels the reset control Start over once a refusal is on screen', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: { ok: false, refusal: { cause: 'no-model-available' } },
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryRefusal(container)).not.toBeNull();
			});
			expect(queryCancel(container)?.textContent).toBe('Start over');
		});

		it('labels the accept control Accept', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
			expect(queryAccept(container)?.textContent).toBe('Accept');
		});

		it('labels the discard control Discard', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading', 'generating'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			await waitFor(() => {
				expect(queryPreview(container)).not.toBeNull();
			});
			expect(queryDiscard(container)?.textContent).toBe('Discard');
		});

		it('hands the socket a way to abort its work', () => {
			const generate = vi.fn(scriptedSocket().generate);
			const container = mountOver('let x = 1;', { generate });
			clickAsk(container);
			expect(generate.mock.calls[0]?.[2]?.signal).toBeInstanceOf(AbortSignal);
		});

		it('hands the socket a signal that is not already aborted', () => {
			const generate = vi.fn(scriptedSocket().generate);
			const container = mountOver('let x = 1;', { generate });
			clickAsk(container);
			expect(generate.mock.calls[0]?.[2]?.signal?.aborted).toBe(false);
		});

		it('aborts the ask the mount leaves behind', () => {
			const generate = vi.fn(
				scriptedSocket({ announces: ['loading'] }).generate,
			);
			const container = mountOver('let x = 1;', { generate });
			clickAsk(container);
			cleanup();
			expect(generate.mock.calls[0]?.[2]?.signal?.aborted).toBe(true);
		});
	});

	describe('an ask that answers after it was retired (Exceptions)', () => {
		it('a stage announced after a stop leaves the view idle', async () => {
			const container = mountOver(
				'let x = 1;',
				abortableSocket({ announces: ['loading', 'generating'] }),
			);
			clickAsk(container);
			clickCancel(container);
			await act(async () => {
				await Promise.resolve();
			});
			expect(queryOutput(container)).toBeNull();
		});

		it('a stage announced by a stopped ask never displaces the next one', async () => {
			const generate = vi.fn(
				scriptedSocket({ announces: ['loading'] }).generate,
			);
			const container = mountOver('let x = 1;', { generate });
			clickAsk(container);
			clickCancel(container);
			clickAsk(container);
			await act(async () => {
				generate.mock.calls[0]?.[2]?.onPhase?.('generating');
				await Promise.resolve();
			});
			expect(queryOutput(container)?.textContent).toBe(
				'Getting the generator ready…',
			);
		});

		it('an answer that lands after a stop renders no candidate', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading'],
					answers: {
						ok: true,
						program: 'let x = 2;',
						meta: { model: 'nano-3', attempts: 1 },
					},
				}),
			);
			clickAsk(container);
			clickCancel(container);
			await act(async () => {
				await Promise.resolve();
			});
			expect(queryPreview(container)).toBeNull();
		});

		it('an answer the shape cannot serve is dropped before it is unwrapped', async () => {
			const container = mountOver(
				'let x = 1;',
				scriptedSocket({
					announces: ['loading'],
					answers: { ok: true, meta: { model: 'nano-3', attempts: 1 } },
				}),
			);
			clickAsk(container);
			clickCancel(container);
			await act(async () => {
				await Promise.resolve();
			});
			expect(queryOutput(container)).toBeNull();
		});

		it('a second ask supersedes an unanswered first', async () => {
			const generate = vi.fn(scriptedSocket().generate);
			const container = mountOver('let x = 1;', { generate });
			clickAsk(container);
			clickAsk(container);
			await act(async () => {
				generate.mock.calls[0]?.[2]?.onPhase?.('loading');
				await Promise.resolve();
			});
			expect(queryOutput(container)).toBeNull();
		});

		it('a rejected ask is an invariant violation', async () => {
			const container = mountOver('let x = 1;', {
				generate: () => Promise.reject(new Error('the socket broke')),
			});
			clickAsk(container);
			await expect(async () => {
				await act(async () => {
					await Promise.resolve();
				});
			}).rejects.toThrow(
				'generator invariant violated: the ask rejected instead of answering',
			);
		});

		it('a rejection from a stopped ask is dropped too', async () => {
			const container = mountOver('let x = 1;', {
				generate: (_program, _request, options) => {
					options?.onPhase?.('loading');
					return Promise.reject(new Error('the socket broke'));
				},
			});
			clickAsk(container);
			clickCancel(container);
			await act(async () => {
				await Promise.resolve();
			});
			expect(queryOutput(container)).toBeNull();
		});
	});

	describe('asking again after a stop (Simple)', () => {
		it('a stopped ask can be asked again straight away', () => {
			const generate = vi.fn(
				scriptedSocket({ announces: ['loading'] }).generate,
			);
			const container = mountOver('let x = 1;', { generate });
			clickAsk(container);
			clickCancel(container);
			clickAsk(container);
			expect(generate).toHaveBeenCalledTimes(2);
		});
	});
});
