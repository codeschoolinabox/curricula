import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import createGeneratorSocket from '../create-generator-socket.js';
import type { GeneratorPhase } from '../types.js';

describe('createGeneratorSocket', () => {
	describe('an ask with an empty seed and an empty prompt (Zero)', () => {
		it('answers the marker comment alone', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', { prompt: '', model: '' });
			expect(result.program).toBe(
				"// No model ran — this came from the study environment's placeholder generator.",
			);
		});

		it('answers ok', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', { prompt: '', model: '' });
			expect(result.ok).toBe(true);
		});
	});

	describe('one prompt over an empty seed (One)', () => {
		it("the marker's second line carries the prompt", async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'add a loop',
				model: '',
			});
			expect(result.program).toBe(
				"// No model ran — this came from the study environment's placeholder generator.\n// Your prompt: add a loop",
			);
		});
	});

	describe('a seed and a prompt together (Many)', () => {
		it('answers the seed, one blank line, then both marker lines', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('const total = 0;', {
				prompt: 'sum the list',
				model: '',
			});
			expect(result.program).toBe(
				"const total = 0;\n\n// No model ran — this came from the study environment's placeholder generator.\n// Your prompt: sum the list",
			);
		});

		it('a multi-line seed survives verbatim', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('let a = 1;\nlet b = 2;', {
				prompt: '',
				model: '',
			});
			expect(result.program).toBe(
				"let a = 1;\nlet b = 2;\n\n// No model ran — this came from the study environment's placeholder generator.",
			);
		});
	});

	describe('the edges of the ask (Boundaries)', () => {
		it('an empty prompt over a seed drops the prompt line', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('alert(1);', {
				prompt: '',
				model: '',
			});
			expect(result.program).toBe(
				"alert(1);\n\n// No model ran — this came from the study environment's placeholder generator.",
			);
		});

		it('a whitespace-only prompt keeps its line, collapsed to one space', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', { prompt: '   ', model: '' });
			expect(result.program).toBe(
				"// No model ran — this came from the study environment's placeholder generator.\n// Your prompt:  ",
			);
		});

		it('a leading whitespace run in the prompt collapses too', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: '  indented ask',
				model: '',
			});
			expect(result.program).toBe(
				"// No model ran — this came from the study environment's placeholder generator.\n// Your prompt:  indented ask",
			);
		});

		it('a newline run inside the prompt collapses to one space', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'first\n\nsecond',
				model: '',
			});
			expect(result.program).toBe(
				"// No model ran — this came from the study environment's placeholder generator.\n// Your prompt: first second",
			);
		});

		// PINNED(AR-3 2026-07-30: U+2028 terminates a line comment exactly as a
		// newline does, so a narrow whitespace class would emit broken JS)
		it('a line separator inside the prompt cannot end the comment early', async () => {
			const separator = String.fromCodePoint(0x20_28);
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: `stop${separator}here`,
				model: '',
			});
			expect(result.program?.includes(separator)).toBe(false);
		});

		it('a whitespace-only seed takes the blank-line path', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('  ', { prompt: '', model: '' });
			expect(result.program).toBe(
				"  \n\n// No model ran — this came from the study environment's placeholder generator.",
			);
		});

		// PINNED(AR-3 2026-07-30: the seed is read-only, so its own trailing
		// newline is never trimmed — the join stays literal)
		it('a seed ending in a newline is joined verbatim', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('let x = 1;\n', {
				prompt: '',
				model: '',
			});
			expect(result.program).toBe(
				"let x = 1;\n\n\n// No model ran — this came from the study environment's placeholder generator.",
			);
		});

		it('a refusal prefix with an unknown remainder refuses as no-model-available', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'refuse: please stop',
				model: '',
			});
			expect(result.refusal).toEqual({
				cause: 'no-model-available',
				nextStep: 'use-native-app',
			});
		});

		it('a refusal answers not-ok', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'refuse: please stop',
				model: '',
			});
			expect(result.ok).toBe(false);
		});

		it('a bare refusal prefix refuses as the default pair', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'refuse:',
				model: '',
			});
			expect(result.refusal).toEqual({
				cause: 'no-model-available',
				nextStep: 'use-native-app',
			});
		});

		it.each(['attempt-bound-exhausted', 'no-model-available', 'unknown-model'])(
			'a named cause %s refuses as itself',
			async (cause) => {
				const socket = createGeneratorSocket({ stageDelay: 0 });
				const result = await socket.generate('', {
					prompt: `refuse:${cause}`,
					model: '',
				});
				expect(result.refusal?.cause).toBe(cause);
			},
		);

		it('a named cause carries no next step', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'refuse:no-model-available',
				model: '',
			});
			expect(Object.hasOwn(result.refusal ?? {}, 'nextStep')).toBe(false);
		});

		it('whitespace around a named cause still refuses as that cause', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'refuse:  attempt-bound-exhausted  ',
				model: '',
			});
			expect(result.refusal?.cause).toBe('attempt-bound-exhausted');
		});

		it('the refusal prefix mid-string is an ordinary ask', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'do not refuse: keep going',
				model: '',
			});
			expect(result.ok).toBe(true);
		});

		it('a leading space before the refusal prefix is an ordinary ask', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: ' refuse:unknown-model',
				model: '',
			});
			expect(result.ok).toBe(true);
		});

		it('a capitalized refusal prefix is an ordinary ask', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'Refuse:unknown-model',
				model: '',
			});
			expect(result.ok).toBe(true);
		});
	});

	describe('the announced stages and the seam (Interfaces)', () => {
		it('an ordinary ask announces loading then generating', async () => {
			const phases: GeneratorPhase[] = [];
			const socket = createGeneratorSocket({ stageDelay: 0 });
			await socket.generate(
				'',
				{ prompt: 'vary this', model: '' },
				{ onPhase: (phase) => phases.push(phase) },
			);
			expect(phases).toEqual(['loading', 'generating']);
		});

		// PINNED(AR-3 2026-07-30: the scripted refusal never takes the
		// refuse-out-of-loading edge a runtime-backed socket can)
		it('a refusal ask announces both stages too', async () => {
			const phases: GeneratorPhase[] = [];
			const socket = createGeneratorSocket({ stageDelay: 0 });
			await socket.generate(
				'',
				{ prompt: 'refuse:unknown-model', model: '' },
				{ onPhase: (phase) => phases.push(phase) },
			);
			expect(phases).toEqual(['loading', 'generating']);
		});

		it('the options argument is optional', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', { prompt: '', model: '' });
			expect(result.ok).toBe(true);
		});

		it('a named model in the request changes nothing', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: '',
				model: 'llama-3',
			});
			expect(result.meta?.model).toBe('placeholder');
		});

		it('the socket object is frozen', () => {
			expect(Object.isFrozen(createGeneratorSocket({ stageDelay: 0 }))).toBe(
				true,
			);
		});

		it('the resolved result is frozen', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', { prompt: '', model: '' });
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('the freeze reaches the nested meta', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', { prompt: '', model: '' });
			expect(Object.isFrozen(result.meta)).toBe(true);
		});

		it('the freeze reaches the nested refusal', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'refuse:',
				model: '',
			});
			expect(Object.isFrozen(result.refusal)).toBe(true);
		});
	});

	describe('the stage delay (Boundaries, on the clock)', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('holds loading for the whole default delay', async () => {
			const phases: GeneratorPhase[] = [];
			const socket = createGeneratorSocket();
			void socket.generate(
				'',
				{ prompt: '', model: '' },
				{ onPhase: (phase) => phases.push(phase) },
			);
			await vi.advanceTimersByTimeAsync(399);
			expect(phases).toEqual(['loading']);
		});

		it('announces generating once the default delay elapses', async () => {
			const phases: GeneratorPhase[] = [];
			const socket = createGeneratorSocket();
			void socket.generate(
				'',
				{ prompt: '', model: '' },
				{ onPhase: (phase) => phases.push(phase) },
			);
			await vi.advanceTimersByTimeAsync(400);
			expect(phases).toEqual(['loading', 'generating']);
		});

		// PINNED(maintainer 2026-07-30: TWO waits, one per stage — generating is
		// held open too, or the drafting state never paints)
		it('holds the answer through a second delay', async () => {
			let settled = false;
			const socket = createGeneratorSocket();
			void socket
				.generate('', { prompt: '', model: '' })
				.then(() => (settled = true));
			await vi.advanceTimersByTimeAsync(799);
			expect(settled).toBe(false);
		});

		it('answers once the second delay elapses', async () => {
			let settled = false;
			const socket = createGeneratorSocket();
			void socket
				.generate('', { prompt: '', model: '' })
				.then(() => (settled = true));
			await vi.advanceTimersByTimeAsync(800);
			expect(settled).toBe(true);
		});
	});

	describe('what an ask never does (Exceptions)', () => {
		it('an ordinary ask resolves rather than rejecting', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			await expect(
				socket.generate('let y = 2;', { prompt: 'tidy it', model: '' }),
			).resolves.toBeDefined();
		});

		it('a refusal ask resolves rather than rejecting', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			await expect(
				socket.generate('', { prompt: 'refuse:unknown-model', model: '' }),
			).resolves.toBeDefined();
		});

		it('an adversarial prompt resolves rather than rejecting', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			await expect(
				socket.generate('', { prompt: '*/ } catch {', model: '' }),
			).resolves.toBeDefined();
		});
	});

	describe('an aborted ask (Exceptions, on the clock)', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('a signal already aborted announces nothing at all', async () => {
			const phases: GeneratorPhase[] = [];
			const socket = createGeneratorSocket({ stageDelay: 10 });
			void socket.generate(
				'',
				{ prompt: '', model: '' },
				{ onPhase: (phase) => phases.push(phase), signal: AbortSignal.abort() },
			);
			await vi.advanceTimersByTimeAsync(10_000);
			expect(phases).toEqual([]);
		});

		it('aborting mid-flight stops the announcements', async () => {
			const phases: GeneratorPhase[] = [];
			const controller = new AbortController();
			const socket = createGeneratorSocket({ stageDelay: 10 });
			void socket.generate(
				'',
				{ prompt: '', model: '' },
				{ onPhase: (phase) => phases.push(phase), signal: controller.signal },
			);
			controller.abort();
			await vi.advanceTimersByTimeAsync(10_000);
			expect(phases).toEqual(['loading']);
		});

		// PINNED(AR-3 2026-07-30: never-settling is a choice the contract permits,
		// not a forced move — pin it so a silent switch to early-resolve is caught)
		it('an aborted ask never settles', async () => {
			let settled = false;
			const controller = new AbortController();
			const socket = createGeneratorSocket({ stageDelay: 10 });
			void socket
				.generate('', { prompt: '', model: '' }, { signal: controller.signal })
				.then(() => (settled = true));
			controller.abort();
			await vi.advanceTimersByTimeAsync(10_000);
			expect(settled).toBe(false);
		});

		// PINNED(AR-4 2026-07-30: aborting during the SECOND delay is the only
		// path that reaches the third guard — without this the guard could be
		// deleted and the whole suite would still pass)
		it('aborting after generating leaves both announcements standing', async () => {
			const phases: GeneratorPhase[] = [];
			const controller = new AbortController();
			const socket = createGeneratorSocket({ stageDelay: 10 });
			void socket.generate(
				'',
				{ prompt: '', model: '' },
				{ onPhase: (phase) => phases.push(phase), signal: controller.signal },
			);
			await vi.advanceTimersByTimeAsync(10);
			controller.abort();
			await vi.advanceTimersByTimeAsync(10_000);
			expect(phases).toEqual(['loading', 'generating']);
		});

		it('aborting after generating stops the answer landing', async () => {
			let settled = false;
			const controller = new AbortController();
			const socket = createGeneratorSocket({ stageDelay: 10 });
			void socket
				.generate('', { prompt: '', model: '' }, { signal: controller.signal })
				.then(() => (settled = true));
			await vi.advanceTimersByTimeAsync(10);
			controller.abort();
			await vi.advanceTimersByTimeAsync(10_000);
			expect(settled).toBe(false);
		});
	});

	describe('what the answer says about its producer (Simple)', () => {
		it('names the placeholder as the producer', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', { prompt: '', model: '' });
			expect(result.meta?.model).toBe('placeholder');
		});

		it('reports one pass', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', { prompt: '', model: '' });
			expect(result.meta?.attempts).toBe(1);
		});

		it('a success carries no refusal', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', { prompt: '', model: '' });
			expect(Object.hasOwn(result, 'refusal')).toBe(false);
		});

		it('a refusal carries no meta', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'refuse:',
				model: '',
			});
			expect(Object.hasOwn(result, 'meta')).toBe(false);
		});

		it('a refusal carries no program', async () => {
			const socket = createGeneratorSocket({ stageDelay: 0 });
			const result = await socket.generate('', {
				prompt: 'refuse:',
				model: '',
			});
			expect(Object.hasOwn(result, 'program')).toBe(false);
		});
	});
});
