import { describe, it, expect } from 'vitest';

import type {
	GenerationResult,
	LoadedModel,
} from '../../../../../lib/local-llm/types.js';
import aithor from '../aithor.js';
import type { AithorRuntime, RefusalCause } from '../types.js';

// Increment 3a — the orchestrator aithor(): config resolution, the load-once
// bring-up short-circuit, and the validate fork's two terminals — uncurated
// (raw, unmodified) and the curated HAPPY path (admit + conform pass on the first
// attempt). The bounded repair loop, load-once counting, admission re-ask, and
// exhaustion arrive in the next increment. Seams are faked: a runtime { loadModel }
// and a LoadedModel { generate } returning canned GenerationResults. The admission
// gate isJej and conform are the REAL units, so canned `code` for the curated path
// is genuine, Prettier-formatted JEJ ('let x = 5;\n' — isJej true, conform-clean).
// Config resolution of lines/complexity is unobservable here (no size-bounded
// fixtures); size-bounded curated cases arrive in the next increment.

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

		it('refuses (attempt-bound-exhausted) when the single attempt fails admission', async () => {
			// 'var x = 5;\n' parses and is Prettier-clean but is NOT JEJ (var) — so the
			// REAL isJej rejects it. Proves admission actually runs on the curated path
			// (an impl that returned .code blindly would wrongly succeed here).
			const model = fakeModel({ raw: 'raw text', code: 'var x = 5;\n' });

			const result = await aithor(
				'',
				{ prompt: 'p', model: 'm' },
				resolvedRuntime('resolved-abc', model),
			);

			expect(result).toEqual({
				ok: false,
				refusal: { cause: 'attempt-bound-exhausted' },
			});
		});
	});
});
