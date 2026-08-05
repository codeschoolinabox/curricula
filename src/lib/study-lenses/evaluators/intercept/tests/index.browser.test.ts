/**
 * @file I7's browser tier: the end-to-end evidence through the kind surface,
 * over the REAL transport — a genuine module Worker with shared memory.
 *
 * This is the only tier that can evidence what the fake cannot, because it is
 * the only one with a program that is still running (the committed § Testing
 * posture): the emit-pause hold, consumer-paced execution, a cancel issued
 * mid-stream against a program demonstrably still going, the full
 * ask–suspend–answer–record–resume loop, delivery order across a dialog, and
 * cancel-while-suspended — the row whose failure is quietest, which is why it
 * asserts that the settlement RESOLVES rather than merely inspecting it.
 *
 * It also carries the end-to-end proof through main of what the Node tier
 * could only compute: a console flow, a throw's stamped location, a limit
 * trip, and a module-axis row (the fake runs the function path regardless of
 * the axis).
 */

import { describe, expect, it } from 'vitest';

import type { Facts } from '../../../embody/types.js';
import type { EvaluationSpec } from '../../types.js';
import intercept from '../index.js';
import type {
	InterceptConsoleRecord,
	InterceptEvent,
	InterceptPendingInteraction,
	InterceptRecord,
	InterceptSettlement,
	InterceptStream,
} from '../types.js';

function specFor(
	code: string,
	extras: Partial<EvaluationSpec> = {},
	snippetType?: 'script' | 'module',
): EvaluationSpec {
	// `type` mirrors embody's real stage shape — a StageSuccess wrapper, not a
	// bare string. A flattened fixture makes the wrap's parse goal read as
	// undefined and silently fall back to script, which turns every
	// module-axis row into a parse defect (caught here on the first real run).
	//
	// It defaults to tracking the axis because a consuming lens maps one from
	// the other, but `snippetType` can set it INDEPENDENTLY: the two are
	// distinct fields (the parse goal versus how the run is posed), and a
	// fixture that always ties them cannot tell an implementation reading one
	// from an implementation reading the other.
	const facts = {
		source: { ok: true, value: code },
		type: {
			ok: true,
			value:
				snippetType ?? (extras.execution === 'module' ? 'module' : 'script'),
		},
	} as unknown as Facts;
	return { facts, execution: 'function', ...extras };
}

function streamFor(spec: EvaluationSpec): InterceptStream {
	const answer = intercept.main(spec);
	if ('refused' in answer) {
		throw new Error(`unexpected refusal: ${answer.reason}`);
	}
	return answer;
}

/** Drain a program that answers no dialogs. */
async function runOf(
	spec: EvaluationSpec,
): Promise<{ events: InterceptEvent[]; settlement: InterceptSettlement }> {
	const stream = streamFor(spec);
	const events: InterceptEvent[] = [];
	for await (const event of stream) {
		events.push(event);
	}
	return { events, settlement: await stream.settled };
}

/**
 * Drain a program that asks, answering each pending interaction with the next
 * scripted answer as it arrives — the consumer half of the suspend/resume
 * loop.
 */
async function answeredRunOf(
	spec: EvaluationSpec,
	answers: readonly unknown[],
): Promise<{ events: InterceptEvent[]; settlement: InterceptSettlement }> {
	const stream = streamFor(spec);
	const pending = [...answers];
	const events: InterceptEvent[] = [];
	for await (const event of stream) {
		events.push(event);
		if (event.kind === 'pending-interaction') {
			event.respond(pending.shift());
		}
	}
	return { events, settlement: await stream.settled };
}

function isRecord(event: InterceptEvent): boolean {
	return event.kind !== 'pending-interaction';
}

/** The error arm, reached by its own discriminant rather than a cast — so a
 * row landing on the wrong arm fails as an assertion instead of crashing on
 * an undefined read. */
function reasonOf(settlement: InterceptSettlement): string {
	if (settlement.ended !== 'error') {
		throw new Error(`expected an error settlement, got ${settlement.ended}`);
	}
	return settlement.error.reason;
}

describe('intercept evaluator (browser — real transport)', () => {
	describe('the environment hosts a run', () => {
		it('does not refuse where Worker and shared memory both exist', () => {
			expect(intercept.main(specFor('1 + 1;'))).not.toHaveProperty('refused');
		});

		it('applicability stays true here too, so it never read the environment', () => {
			// PINNED(D8-as-widened, human-ratified 2026-07-28: applicability is PURE over the spec — an implementation that conflated it with the environment probe would flip here, where Worker exists, and break the consuming lens's options list)
			expect(intercept.applicability(specFor('1 + 1;'))).toBe(true);
		});
	});

	describe('a console flow, end to end', () => {
		it('yields one record per call, in the program order', async () => {
			const { events } = await runOf(
				specFor("console.log('a');\nconsole.warn('b');"),
			);

			expect(
				events.map((event) => (event as InterceptConsoleRecord).method),
			).toEqual(['log', 'warn']);
		});

		it("each record carries the learner's own call-site span", async () => {
			const { events } = await runOf(specFor("console.log('hi');"));

			expect(events[0]?.loc?.start).toStrictEqual({ line: 1, column: 0 });
		});

		it('the run settles clean once its records are taken', async () => {
			const { settlement } = await runOf(specFor("console.log('a');"));

			expect(settlement).toStrictEqual({ ended: 'clean' });
		});

		it('settles clean having produced nothing when its only output rides a timer', async () => {
			// PINNED(committed README § Edge cases: work scheduled past the natural end never runs, on both axes)
			const { events, settlement } = await runOf(
				specFor("setTimeout(() => console.log('late'), 0);"),
			);

			expect([events.length, settlement]).toEqual([0, { ended: 'clean' }]);
		});
	});

	describe('the emit-pause hold — only a live program can evidence it', () => {
		it('a record holds the program until the consumer takes it', async () => {
			const stream = streamFor(
				specFor("console.log('a');\nconsole.log('b');\nconsole.log('c');"),
			);
			const iterator = stream[Symbol.asyncIterator]();
			await iterator.next();
			// Nothing else is pulled: with the hold in force the program is
			// parked at its first boundary moment, so the run cannot have ended.
			const settledFirst = await Promise.race([
				stream.settled.then(() => 'settled'),
				new Promise((resolve) => setTimeout(() => resolve('held'), 250)),
			]);
			void iterator.return?.();

			expect(settledFirst).toBe('held');
		});

		it('the slack after an answered ask is at most one event — the next still needs its pull', async () => {
			// PINNED(committed DOCS § Testing names this row by name — "the hold and its one-event exception"; ar-3 I7 found it had no coverage anywhere, and it is timing-shaped, so this tier is the only one that can carry it)
			const stream = streamFor(
				specFor("prompt('who?');\nconsole.log('a');\nconsole.log('b');"),
			);
			const iterator = stream[Symbol.asyncIterator]();
			const first = await iterator.next();
			(first.value as InterceptPendingInteraction).respond('Ada');
			await iterator.next();
			await iterator.next();
			// 'b' has not been pulled: one event of slack may follow the ask, but
			// the hold must reassert itself — a runaway would have settled by now.
			const settledFirst = await Promise.race([
				stream.settled.then(() => 'settled'),
				new Promise((resolve) => setTimeout(() => resolve('held'), 250)),
			]);
			void iterator.return?.();

			expect(settledFirst).toBe('held');
		});

		it('the program advances at the pace the consumer reads', async () => {
			const stream = streamFor(specFor("console.log('a');\nconsole.log('b');"));
			const iterator = stream[Symbol.asyncIterator]();
			const first = await iterator.next();
			const second = await iterator.next();
			void iterator.return?.();

			expect([
				(first.value as InterceptRecord).args[0],
				(second.value as InterceptRecord).args[0],
			]).toEqual(['a', 'b']);
		});
	});

	describe('the full ask–suspend–answer–record–resume loop', () => {
		it('a prompt suspends as the distinguished event carrying its request', async () => {
			const stream = streamFor(specFor("prompt('who?');"));
			const iterator = stream[Symbol.asyncIterator]();
			const first = await iterator.next();
			const pending = first.value as InterceptPendingInteraction;
			pending.respond('Ada');
			void iterator.return?.();

			expect(pending.request).toStrictEqual({
				kind: 'prompt',
				message: 'who?',
			});
		});

		it('the record is the very next event after its ask — the adjacency the pairing rests on', async () => {
			// PINNED(ar-1 CP-1 ruling 2026-08-04: adjacency is the only pairing there is — the worker is genuinely blocked for a dialog's whole span, so nothing can be emitted between the two)
			const { events } = await answeredRunOf(specFor("prompt('who?');"), [
				'Ada',
			]);

			expect(events.map((event) => event.kind)).toEqual([
				'pending-interaction',
				'prompt',
			]);
		});

		it('the record carries what the program received', async () => {
			const { events } = await answeredRunOf(specFor("prompt('who?');"), [
				'Ada',
			]);

			expect(events[1]).toHaveProperty('returnValue', 'Ada');
		});

		it('the answer reaches the program, which runs on with it', async () => {
			const { events } = await answeredRunOf(
				specFor("const name = prompt('who?');\nconsole.log(name);"),
				['Ada'],
			);

			expect((events.at(-1) as InterceptConsoleRecord).args).toEqual(['Ada']);
		});

		it('confirm answered false returns false to the program', async () => {
			const { events } = await answeredRunOf(
				specFor("const ok = confirm('sure?');\nconsole.log(ok);"),
				[false],
			);

			expect((events.at(-1) as InterceptConsoleRecord).args).toEqual([false]);
		});

		it("alert's record carries the modelled undefined", async () => {
			// PINNED(H-3 ruled 2026-08-04: alert hands back undefined and that is part of what is modelled — proven here over the real transport, not only against a stub)
			const { events } = await answeredRunOf(specFor("alert('done');"), [
				'ignored anyway',
			]);

			expect(
				(events[1] as { returnValue?: unknown }).returnValue,
			).toBeUndefined();
		});

		it('a dialog inside a console argument is strictly sequential', async () => {
			// PINNED(committed README § Edge cases: the prompt suspends, is answered, emits its record, and only then does the console call happen — two interactions are never pending at once, even here)
			const { events } = await answeredRunOf(
				specFor("console.log(prompt('who?'));"),
				['Ada'],
			);

			expect(events.map((event) => event.kind)).toEqual([
				'pending-interaction',
				'prompt',
				'console',
			]);
		});

		it('delivery order across a dialog keeps the program order', async () => {
			// PINNED(ar-2 blocker 2026-08-04: racing the two thread-side sources could deliver a later pending interaction ahead of an earlier dialog's record — one arrival queue in worker post order is what forecloses it)
			const { events } = await answeredRunOf(
				specFor(
					"const a = prompt('first?');\nconsole.log(a);\nconst b = prompt('second?');\nconsole.log(b);",
				),
				['one', 'two'],
			);

			expect(events.map((event) => event.kind)).toEqual([
				'pending-interaction',
				'prompt',
				'console',
				'pending-interaction',
				'prompt',
				'console',
			]);
		});

		it('the run settles clean after every ask is answered', async () => {
			const { settlement } = await answeredRunOf(specFor("prompt('who?');"), [
				'Ada',
			]);

			expect(settlement).toStrictEqual({ ended: 'clean' });
		});

		it('every event carries its own step, numbered in emission order', async () => {
			const { events } = await answeredRunOf(
				specFor("const a = prompt('who?');\nconsole.log(a);"),
				['Ada'],
			);

			expect(events.map((event) => event.step)).toEqual([1, 2, 3]);
		});
	});

	describe('a suspended run is the one thing outside cannot end', () => {
		it('cancel-while-suspended settles canceled — and the settlement RESOLVES', async () => {
			// PINNED(committed README § Testing posture: this is the row whose failure is quietest — a missing release surfaces as a runner timeout rather than a failed expectation, which is why it asserts resolution)
			const stream = streamFor(
				specFor("prompt('who?');\nconsole.log('after');"),
			);
			const iterator = stream[Symbol.asyncIterator]();
			const first = await iterator.next();
			void iterator.return?.();

			expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
			expect(first.value).toHaveProperty('kind', 'pending-interaction');
		});

		it('the released answer never reaches the program — nothing runs after the ask', async () => {
			// PINNED(committed DOCS phase 11: teardown stops the run out of band and THEN releases, so the released answer is discarded rather than resuming a program that is already over)
			const stream = streamFor(
				specFor("prompt('who?');\nconsole.log('after');"),
			);
			const iterator = stream[Symbol.asyncIterator]();
			const first = await iterator.next();
			void iterator.return?.();
			await stream.settled;
			(first.value as InterceptPendingInteraction).respond('too late');
			const next = await iterator.next();

			expect(next).toStrictEqual({ done: true, value: undefined });
		});

		it('cancel releases a SECOND still-pending dialog after an earlier one resolved', async () => {
			// PINNED(ar-3 I7 resolution 2026-08-05: a release latch set once and never reset would misbehave only on the second occurrence — the adjacency guarantee is about any pending interaction, not specially the first)
			const stream = streamFor(
				specFor("prompt('first?');\nconsole.log('mid');\nprompt('second?');"),
			);
			const iterator = stream[Symbol.asyncIterator]();
			const first = await iterator.next();
			(first.value as InterceptPendingInteraction).respond('one');
			await iterator.next();
			await iterator.next();
			const secondAsk = await iterator.next();
			void iterator.return?.();

			expect([await stream.settled, secondAsk.value]).toMatchObject([
				{ ended: 'canceled' },
				{ kind: 'pending-interaction' },
			]);
		});

		it('an answer larger than the call channel can carry settles the defect arm', async () => {
			// PINNED(committed README § Edge cases: the ONE bad answer the channel does not catch — it is accepted, and the run then ends defect when the machinery cannot write it back; sizing an answer is the consuming lens's job, and only the real shared-memory channel can evidence the ceiling)
			const stream = streamFor(specFor("prompt('who?');"));
			const iterator = stream[Symbol.asyncIterator]();
			const first = await iterator.next();
			(first.value as InterceptPendingInteraction).respond('x'.repeat(20_000));

			expect(await stream.settled).toHaveProperty('error.reason', 'defect');
		});

		it('an answer after teardown is inert, never a throw', async () => {
			const stream = streamFor(specFor("prompt('who?');"));
			const iterator = stream[Symbol.asyncIterator]();
			const first = await iterator.next();
			void iterator.return?.();
			await stream.settled;

			expect(() =>
				(first.value as InterceptPendingInteraction).respond('late'),
			).not.toThrow();
		});
	});

	describe('a program that throws', () => {
		it('settles error with reason threw', async () => {
			const { settlement } = await runOf(specFor('null();'));

			expect(settlement).toHaveProperty('error.reason', 'threw');
		});

		it('carries the innermost wrapped call site it escaped', async () => {
			// PINNED(committed README § Design commitments: a throw is attributed to the innermost call it escaped — proven end to end through a real worker)
			const { settlement } = await runOf(
				specFor('function boom() {\n\tnull();\n}\nboom();'),
			);

			expect(settlement).toHaveProperty('error.loc.start', {
				line: 2,
				column: 1,
			});
		});

		it('a statement-level throw outside any wrap carries loc null', async () => {
			const { settlement } = await runOf(specFor('null.foo;'));

			expect(settlement).toHaveProperty('error.loc', null);
		});

		it('a non-Error throw is rendered in honest machine words', async () => {
			const { settlement } = await runOf(specFor("throw 'oops';"));

			expect(settlement).toHaveProperty('error.message', 'oops');
		});

		it('the records emitted before the throw stand', async () => {
			const { events, settlement } = await runOf(
				specFor("console.log('before');\nnull();"),
			);

			expect([
				events.filter((event) => isRecord(event)).length,
				settlement,
			]).toMatchObject([1, { ended: 'error' }]);
		});
	});

	describe('a capped runaway loop', () => {
		it('settles loop-cap', async () => {
			const { settlement } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(settlement).toHaveProperty('error.reason', 'loop-cap');
		});

		it("carries the loop's own decoded span", async () => {
			const { settlement } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(settlement).toHaveProperty('error.trip.loc.start', {
				line: 1,
				column: 0,
			});
		});

		it('carries the run total, including the tripping iteration', async () => {
			const { settlement } = await runOf(
				specFor('while (true) { let x = 1; }', { iterations: 5 }),
			);

			expect(settlement).toHaveProperty('error.iterationCount', 6);
		});
	});

	describe('the module axis', () => {
		it('settles clean on trivial code — the baseline for the differential row', async () => {
			const { settlement } = await runOf(
				specFor('let x = 1;', { execution: 'module' }),
			);

			expect(settlement).toStrictEqual({ ended: 'clean' });
		});

		it('runs top-level await, which the function path cannot — the axis rides through', async () => {
			// PINNED(committed README § Design commitments: the execution axis rides through unchanged; the fake runs the function path regardless, so only this tier evidences it)
			const { settlement } = await runOf(
				specFor('await 1;', { execution: 'module' }),
			);

			expect(settlement).toStrictEqual({ ended: 'clean' });
		});

		it('emits records on the module axis too', async () => {
			// The learner's record is FOUND rather than indexed: on this axis the
			// injected globals live on the worker's `globalThis`, so anything else
			// running in that worker sees the trap too — under a dev server that
			// includes the HMR client's own connection log, which is harness noise,
			// not a learner moment. (Production ships no such client; the trap
			// being global on this path is the engine's documented delivery
			// channel, not something intercept can narrow.)
			const { events } = await runOf(
				specFor("console.log('mod');", { execution: 'module' }),
			);
			const learnerRecords = events.filter(
				(event): event is InterceptConsoleRecord =>
					event.kind === 'console' &&
					event.method === 'log' &&
					event.args[0] === 'mod',
			);

			expect(learnerRecords).toHaveLength(1);
		});

		it("the parse goal is the snippet's own, not the execution axis", async () => {
			// PINNED(ar-3 I7 resolution 2026-08-05: every other fixture ties facts.type to the axis in lockstep, so an implementation reading the AXIS as its parse goal would be byte-identical on all of them — this pair varies ONLY the snippet type and diverges)
			const asModule = await runOf(
				specFor('await 1;', { execution: 'function' }, 'module'),
			);
			const asScript = await runOf(
				specFor('await 1;', { execution: 'function' }, 'script'),
			);

			expect([
				reasonOf(asModule.settlement),
				reasonOf(asScript.settlement),
			]).toEqual(['threw', 'defect']);
		});

		it('maps a rejected top-level evaluation to reason threw', async () => {
			const { settlement } = await runOf(
				specFor("await Promise.reject(new Error('rej'));", {
					execution: 'module',
				}),
			);

			expect(settlement).toHaveProperty('error.reason', 'threw');
		});
	});

	describe('cancellation of a live run', () => {
		it('a cancel mid-stream against a still-running program settles canceled', async () => {
			const stream = streamFor(
				specFor("while (true) { console.log('spin'); }"),
			);
			const iterator = stream[Symbol.asyncIterator]();
			await iterator.next();
			void iterator.return?.();

			expect(await stream.settled).toStrictEqual({ ended: 'canceled' });
		});

		it('settles promptly, well under the engine default budget', async () => {
			const stream = streamFor(
				specFor("while (true) { console.log('spin'); }"),
			);
			const iterator = stream[Symbol.asyncIterator]();
			const startedAt = performance.now();
			await iterator.next();
			void iterator.return?.();
			await stream.settled;

			expect(performance.now() - startedAt).toBeLessThan(4000);
		});
	});
});
