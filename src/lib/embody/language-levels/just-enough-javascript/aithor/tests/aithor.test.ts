import { describe, it, expect } from 'vitest';

import type {
	GenerationResult,
	LoadedModel,
} from '../../../../../study-lenses/lib/local-llm/types.js';
import aithor from '../aithor.js';
import conform from '../conform.js';
import type { AithorRuntime, RefusalCause } from '../types.js';

// The orchestrator aithor(): config resolution, the load-once bring-up
// short-circuit, the validate fork (uncurated raw vs the curated admit → conform
// → repair loop), the bounded attempt count, and result/refusal shaping. Seams
// are faked: a runtime { loadModel } and a LoadedModel { generate } returning
// canned GenerationResults. The admission gate isJej and conform are the REAL
// units, so canned `code` is genuine, Prettier-formatted JEJ ('let x = 5;\n' —
// isJej true, conform-clean; 'var x = 5;\n' — parses + formatted but NOT JEJ; an
// `if` body — admitted JEJ that conform rejects under exclude:['if']).

// Strict: one configured reply per generate call. Overrunning (an accidental
// double-generate) THROWS rather than clamping, so it surfaces as a test failure
// instead of a silent false-green.
function fakeModel(...replies: readonly GenerationResult[]): LoadedModel {
	let index = 0;
	return {
		generate: () => {
			const reply = replies[index];
			index += 1;
			if (reply === undefined)
				throw new Error(
					`fakeModel: unexpected generate call #${index} (only ${replies.length} configured)`,
				);
			return Promise.resolve(reply);
		},
	};
}

function resolvedRuntime(
	resolvedId: string,
	model: LoadedModel,
): AithorRuntime {
	return { loadModel: () => Promise.resolve({ model, resolvedId }) };
}

function refusingRuntime(cause: RefusalCause): AithorRuntime {
	return { loadModel: () => Promise.resolve({ cause }) };
}

// Records every prompt it is handed, returning canned replies in sequence
// (strict overrun like fakeModel). Lets a rung inspect the repair (or base) turn.
function recordingModel(...replies: readonly GenerationResult[]): {
	model: LoadedModel;
	prompts: readonly string[];
} {
	const prompts: string[] = [];
	let index = 0;
	return {
		prompts,
		model: {
			generate: (prompt) => {
				prompts.push(prompt);
				const reply = replies[index];
				index += 1;
				if (reply === undefined)
					throw new Error(`recordingModel: unexpected generate call #${index}`);
				return Promise.resolve(reply);
			},
		},
	};
}

// Always returns the same reply, counting calls — for the attempt-bound and
// load-once arcs.
function countingModel(reply: GenerationResult): {
	model: LoadedModel;
	calls: () => number;
} {
	let calls = 0;
	return {
		calls: () => calls,
		model: {
			generate: () => {
				calls += 1;
				return Promise.resolve(reply);
			},
		},
	};
}

// Counts loadModel invocations — pins per-request load-once.
function countingRuntime(
	resolvedId: string,
	model: LoadedModel,
): { runtime: AithorRuntime; calls: () => number } {
	let calls = 0;
	return {
		calls: () => calls,
		runtime: {
			loadModel: () => {
				calls += 1;
				return Promise.resolve({ model, resolvedId });
			},
		},
	};
}

describe('aithor', () => {
	describe('zero — bring-up refusal short-circuits', () => {
		it('returns the loader refusal and never produces a program', async () => {
			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm' },
				refusingRuntime('no-model-available'),
			);

			expect(result).toEqual({
				ok: false,
				refusal: { cause: 'no-model-available' },
			});
		});

		it('passes an unknown-model bring-up refusal straight through', async () => {
			const result = await aithor(
				'',
				{ prompt: 'p', model: 'nope' },
				refusingRuntime('unknown-model'),
			);

			expect(result.ok).toBe(false);
			expect(result.refusal).toEqual({ cause: 'unknown-model' });
			expect(result.program).toBeUndefined();
			expect(result.meta).toBeUndefined();
		});
	});

	describe('one — uncurated (validate:false) returns the raw program unmodified', () => {
		it('returns raw byte-exact with meta, skipping admit/conform/repair', async () => {
			// Drifty, non-JEJ, fenced — would fail admission, yet must be returned as-is.
			const raw = '```js\nvar x = 1  // drift, no semicolon, non-JEJ\n```';
			const model = fakeModel({ raw, code: 'let x = 1;\n' });

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'requested-name', validate: false },
				resolvedRuntime('resolved-xyz', model),
			);

			expect(result.ok).toBe(true);
			expect(result.program).toBe(raw); // byte-exact, the .raw — NOT the .code
			expect(result.meta).toEqual({ model: 'resolved-xyz', attempts: 1 });
		});

		it('reports meta.model as the resolvedId, never config.model (default pick)', async () => {
			const model = fakeModel({ raw: 'anything', code: 'x' });

			const result = await aithor(
				'',
				{ prompt: 'p', model: '', validate: false },
				resolvedRuntime('runtime-chose-this', model),
			);

			expect(result.meta?.model).toBe('runtime-chose-this');
		});
	});

	describe('one — curated (validate defaults true)', () => {
		it('happy path: returns the admitted + conformant code with attempts 1', async () => {
			const model = fakeModel({ raw: 'noise around it', code: 'let x = 5;\n' });

			// validate omitted → defaults true; include/exclude omitted → default [].
			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm' },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result.ok).toBe(true);
			expect(result.program).toBe('let x = 5;\n'); // the .code (admitted + conformant)
			expect(result.meta).toEqual({ model: 'resolved-abc', attempts: 1 });
		});
		// The curated FAIL terminal (admission/conformance never satisfied) is the
		// attempt bound's job — exercised under 'boundary — the attempt bound' below,
		// which proves admission + conformance genuinely run on the curated path.
	});

	describe('many — curated repair loop', () => {
		it('repairs a non-conformant candidate and succeeds on attempt 2, carrying the candidate + located reason into the repair prompt', async () => {
			const bad = 'if (true) {\n\tlet y = 1;\n}\n'; // admitted JEJ, but uses `if`
			const good = 'let x = 5;\n';
			const { model, prompts } = recordingModel(
				{ raw: 'r1', code: bad },
				{ raw: 'r2', code: good },
			);

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm', exclude: ['if'] },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result.ok).toBe(true);
			expect(result.program).toBe(good);
			expect(result.meta).toEqual({ model: 'resolved-abc', attempts: 2 });

			// The 2nd (repair) turn folds in the refused candidate AND the located
			// conformance reason — computed here from the REAL conform, so the test
			// proves the violations (not just the candidate) reached the prompt.
			const verdict = conform(bad, { include: [], exclude: ['if'] }, {});
			const message = verdict.violations[0]?.message ?? '';
			expect(message).not.toBe('');
			expect(prompts).toHaveLength(2);
			expect(prompts[1]).toContain(bad);
			expect(prompts[1]).toContain(message);
		});

		it('brings the model up exactly once across the repair (load-once)', async () => {
			const bad = 'if (true) {\n\tlet y = 1;\n}\n';
			const good = 'let x = 5;\n';
			const { model } = recordingModel(
				{ raw: 'r1', code: bad },
				{ raw: 'r2', code: good },
			);
			const { runtime, calls } = countingRuntime('resolved-abc', model);

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm', exclude: ['if'] },
				runtime,
			);

			expect(result.ok).toBe(true);
			expect(calls()).toBe(1); // one loadModel, though generate ran twice
		});
	});

	describe('many — admission failure re-asks (no repair seed)', () => {
		it('re-asks with the bare base prompt on an admission failure, succeeding on attempt 2', async () => {
			const notJej = 'var x = 5;\n'; // parses + formatted, but not JEJ → fails admission
			const good = 'let x = 5;\n';
			const { model, prompts } = recordingModel(
				{ raw: 'r1', code: notJej },
				{ raw: 'r2', code: good },
			);

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm' },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result.ok).toBe(true);
			expect(result.program).toBe(good);
			expect(result.meta).toEqual({ model: 'resolved-abc', attempts: 2 });

			// Admission failures carry no conformance violations, so the re-ask is the
			// BASE prompt — byte-identical to the first turn, no candidate folded in.
			expect(prompts).toHaveLength(2);
			expect(prompts[1]).toBe(prompts[0]);
			expect(prompts[1]).not.toContain(notJej);
		});

		it('does not leak a prior conformance repair into a later admission-failure re-ask', async () => {
			// Mixed sequence: attempt 1 conformance-fails (seeds repair), attempt 2
			// admission-fails (must WIPE that repair), attempt 3 succeeds bare. Guards
			// the `repair = undefined` reset — without it, attempt 3's prompt would
			// still carry attempt 1's candidate.
			const conformBad = 'if (true) {\n\tlet y = 1;\n}\n'; // admitted, conform-fails (if)
			const notJej = 'var x = 5;\n'; // admission-fails
			const good = 'let x = 5;\n';
			const { model, prompts } = recordingModel(
				{ raw: 'r1', code: conformBad },
				{ raw: 'r2', code: notJej },
				{ raw: 'r3', code: good },
			);

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm', exclude: ['if'] },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result.ok).toBe(true);
			expect(result.meta).toEqual({ model: 'resolved-abc', attempts: 3 });
			expect(prompts).toHaveLength(3);
			expect(prompts[2]).toBe(prompts[0]); // bare base — repair was reset
			expect(prompts[2]).not.toContain(conformBad); // no stale candidate leak
		});
	});

	describe('boundary — the attempt bound', () => {
		it('refuses attempt-bound-exhausted after a fixed number of non-conformant attempts', async () => {
			const bad = 'if (true) {\n\tlet y = 1;\n}\n'; // admitted, always conform-fails
			const { model, calls } = countingModel({ raw: 'r', code: bad });

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm', exclude: ['if'] },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result).toEqual({
				ok: false,
				refusal: { cause: 'attempt-bound-exhausted' },
			});
			expect(calls()).toBe(3); // exactly MAX_ATTEMPTS generations, then refuse
		});

		it('also exhausts when every attempt fails admission', async () => {
			const notJej = 'var x = 5;\n';
			const { model, calls } = countingModel({ raw: 'r', code: notJej });

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm' },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result.ok).toBe(false);
			expect(result.refusal).toEqual({ cause: 'attempt-bound-exhausted' });
			expect(calls()).toBe(3);
		});
	});

	describe('exceptions — the default runtime (no runtime injected)', () => {
		it('refuses unknown-model for a name absent from the default catalog, no runtime wired', async () => {
			// No 3rd arg → the module-level backend-agnostic default runtime. The
			// unknown-model pre-check short-circuits before any device probe, so this
			// stays hermetic (no real WebGPU / network).
			const result = await aithor('', {
				prompt: 'p',
				model: 'definitely-not-in-the-default-catalog',
			});

			expect(result.ok).toBe(false);
			expect(result.refusal).toEqual({ cause: 'unknown-model' });
		});
	});

	describe('boundary — lines:0 is a real bound, not dropped', () => {
		it('refuses a multi-line program under lines:0 (0 survives resolution)', async () => {
			// 'let x = 5;\n' is admitted and >0 lines. With lines:0 it over-runs the
			// bound, so conform fails every attempt → exhausted. If lines:0 were dropped
			// to undefined (unbounded) it would succeed — so ok:false proves 0 survived.
			const { model } = countingModel({ raw: 'r', code: 'let x = 5;\n' });

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm', lines: 0 },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result.ok).toBe(false);
			expect(result.refusal).toEqual({ cause: 'attempt-bound-exhausted' });
		});
	});

	// Increment 4 — vary wires into the request: assertVaryExclusive + resolveVary
	// run BEFORE bring-up (a config-shape mistake throws, it does not refuse); the
	// resolved hard holds REPLACE the raw subset/size (enforced under validate),
	// the soft holds ride into the prompt. These prove the WIRING; the compilation
	// itself is covered by resolve-vary / build-prompt unit tests.
	describe('vary — the config compiles into the request', () => {
		const seedWithIf = 'let a = 1;\nif (a) {\n\ta = 2;\n}\n'; // inventory ['if']
		const usesWhile = 'let a = 1;\nwhile (a) {\n\ta = 2;\n}\n'; // admitted JEJ, not 'if'

		it('compiles hard + soft holds into the prompt; under validate:false stays prompt-only', async () => {
			const { model, prompts } = recordingModel({
				raw: usesWhile,
				code: usesWhile,
			});

			const result = await aithor(
				seedWithIf,
				{
					prompt: 'p',
					model: 'm',
					validate: false,
					vary: { languageLevel: false, behavior: false },
				},
				resolvedRuntime('resolved-abc', model),
			);

			// hard hold: the seed's inventory becomes the feature clause
			expect(prompts[0]).toContain('if-statements');
			// soft hold: the behavior instruction, pinned to the starting point
			expect(prompts[0]).toContain('outwardly visible behavior');
			expect(prompts[0]).toContain('starting-point program');
			// validate:false ⇒ prompt-only: the raw (which violates the held level)
			// passes through unmodified — conform never runs
			expect(result.ok).toBe(true);
			expect(result.program).toBe(usesWhile);
		});

		it('enforces a hard hold under validate:true — a reply outside the held level exhausts', async () => {
			// the model keeps returning a `while` program: admitted JEJ, but conform-
			// rejected under the held subset (inventory ['if']) → the bound is spent.
			const model = fakeModel(
				{ raw: 'r1', code: usesWhile },
				{ raw: 'r2', code: usesWhile },
				{ raw: 'r3', code: usesWhile },
			);

			const result = await aithor(
				seedWithIf,
				{ prompt: 'p', model: 'm', vary: { languageLevel: false } },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result.ok).toBe(false);
			expect(result.refusal).toEqual({ cause: 'attempt-bound-exhausted' });
		});

		it('throws (not refuses) when vary declares an aspect beside a raw constraint, before bring-up', async () => {
			const { model } = countingModel({ raw: 'x', code: 'let x = 5;\n' });
			const { runtime, calls } = countingRuntime('resolved-abc', model);

			await expect(
				aithor(
					seedWithIf,
					{
						prompt: 'p',
						model: 'm',
						vary: { languageLevel: false },
						include: ['if'],
					},
					runtime,
				),
			).rejects.toThrow();
			expect(calls()).toBe(0); // a config-shape throw fires BEFORE bring-up
		});

		it('throws when a hard hold has no seed to read off (empty program), before bring-up', async () => {
			const { model } = countingModel({ raw: 'x', code: 'let x = 5;\n' });
			const { runtime, calls } = countingRuntime('resolved-abc', model);

			await expect(
				aithor(
					'',
					{ prompt: 'p', model: 'm', vary: { languageLevel: false } },
					runtime,
				),
			).rejects.toThrow();
			expect(calls()).toBe(0);
		});

		it('a soft-only hold on an empty seed does not throw and rides into the prompt', async () => {
			const { model, prompts } = recordingModel({
				raw: 'x',
				code: 'let x = 5;\n',
			});

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm', validate: false, vary: { strategy: false } },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result.ok).toBe(true);
			expect(prompts[0]).toContain('algorithm'); // the strategy soft instruction
		});

		it('rides soft holds into the REPAIR turn prompt too, not just the initial turn', async () => {
			// first reply violates the held level → a repair turn; second conforms.
			const { model, prompts } = recordingModel(
				{ raw: 'r1', code: usesWhile },
				{ raw: 'r2', code: 'let x = 5;\n' },
			);

			const result = await aithor(
				seedWithIf,
				{
					prompt: 'p',
					model: 'm',
					vary: { languageLevel: false, behavior: false },
				},
				resolvedRuntime('resolved-abc', model),
			);

			expect(result.ok).toBe(true);
			expect(prompts).toHaveLength(2);
			// the soft hold rides BOTH buildPrompt calls (initial + repair)
			expect(prompts[0]).toContain('outwardly visible behavior');
			expect(prompts[1]).toContain('outwardly visible behavior');
		});

		it('vary: {} is inert — no throw on an empty seed, no vary section', async () => {
			const { model, prompts } = recordingModel({
				raw: 'x',
				code: 'let x = 5;\n',
			});

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm', validate: false, vary: {} },
				resolvedRuntime('resolved-abc', model),
			);

			// declares nothing ⇒ resolveVary is a no-op (no hard hold ⇒ no throw even
			// on an empty seed), and renderVary emits no section
			expect(result.ok).toBe(true);
			expect(prompts[0]).not.toContain('starting-point program');
		});

		it('vary: {} leaves a raw constraint intact — truly equivalent to no vary', async () => {
			// the inert guard: vary:{} must NOT drop a raw include:['if']. A `while`
			// reply is outside include:['if'], so conform rejects it every turn and the
			// bound is spent — proving the raw constraint survived (it would pass under
			// a permit-all subset if vary:{} had wrongly overridden it).
			const model = fakeModel(
				{ raw: 'r1', code: usesWhile },
				{ raw: 'r2', code: usesWhile },
				{ raw: 'r3', code: usesWhile },
			);

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm', vary: {}, include: ['if'] },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result.ok).toBe(false);
			expect(result.refusal).toEqual({ cause: 'attempt-bound-exhausted' });
		});
	});
});
