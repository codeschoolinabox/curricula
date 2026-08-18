// cspell:ignore socratizing Socratizing

import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Embodiment } from '../../../../embody/types.js';
import analyzeMicroDecisions from '../analyze-micro-decisions.js';
import socratizingQuestioner from '../socratizing-questioner.js';

function withFailedEnvironment(embodiment: Embodiment): Embodiment {
	return {
		...embodiment,
		facts: {
			...embodiment.facts,
			environment: {
				ok: false,
				cause: { stage: 'environment', message: 'scope exploded', offset: 3 },
			},
		},
	};
}

describe('socratizingQuestioner', () => {
	it('names itself socratizing', () => {
		expect(socratizingQuestioner.name).toBe('socratizing');
	});

	describe('serves', () => {
		it('serves a parseable snippet', () => {
			expect(socratizingQuestioner.serves(embody('let x = 1;').facts)).toBe(
				true,
			);
		});

		it('declines facts whose ast failed', () => {
			expect(socratizingQuestioner.serves(embody('let = ;').facts)).toBe(false);
		});

		it('declines facts whose environment failed', () => {
			expect(
				socratizingQuestioner.serves(
					withFailedEnvironment(embody('let x = 1;')).facts,
				),
			).toBe(false);
		});
	});

	describe('ask', () => {
		it('answers a parseable embodiment with questions', () => {
			const result = socratizingQuestioner.ask(embody('let x = 5;'));
			expect(result.ok && result.questions.length > 0).toBe(true);
		});

		it('refuses the same embodiment serves declined', () => {
			const declined = withFailedEnvironment(embody('let x = 1;'));
			expect([
				socratizingQuestioner.serves(declined.facts),
				socratizingQuestioner.ask(declined).ok,
			]).toEqual([false, false]);
		});

		it("refuses an unparseable embodiment with the parser's cause", () => {
			expect(socratizingQuestioner.ask(embody('let = ;'))).toMatchObject({
				ok: false,
				error: { message: expect.any(String) },
			});
		});
	});

	describe('envelope', () => {
		it('delegates ask to the live engine', () => {
			// PINNED(wrapper-only — design review 2026-08-18: the engine entry IS
			// the ask; adding wrapper logic between envelope and engine needs a
			// ruling)
			expect(socratizingQuestioner.ask).toBe(analyzeMicroDecisions);
		});

		it('is frozen', () => {
			expect(Object.isFrozen(socratizingQuestioner)).toBe(true);
		});
	});
});
