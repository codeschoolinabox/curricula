import { describe, expect, it } from 'vitest';

import DISPLAY_LABELS from '../display-labels.js';

describe.skip('DISPLAY_LABELS', () => {
	describe('the none-state (Zero)', () => {
		it('displays as plain JavaScript', () => {
			expect(DISPLAY_LABELS.noneStateLevel).toBe('plain JavaScript');
		});
	});

	describe('a label with no separator to truncate at (One)', () => {
		it('the source phase draws Source at full length', () => {
			expect(DISPLAY_LABELS.phaseLabels.source).toBe('Source');
		});

		it('the source phase draws Source short as well', () => {
			expect(DISPLAY_LABELS.phaseShortLabels.source).toBe('Source');
		});
	});

	describe('every phase carries two authored strings (Many)', () => {
		it('the full labels cover all five phases', () => {
			expect(Object.values(DISPLAY_LABELS.phaseLabels)).toEqual([
				'Source',
				'Tokens · spelling',
				'AST · grammar',
				'Environment · names',
				'Evaluation · run',
			]);
		});

		it('the short labels cover all five phases', () => {
			expect(Object.values(DISPLAY_LABELS.phaseShortLabels)).toEqual([
				'Source',
				'Tokens',
				'AST',
				'Environment',
				'Evaluation',
			]);
		});

		it('the short label is not the full label truncated at its separator', () => {
			expect([
				DISPLAY_LABELS.phaseShortLabels.source ===
					DISPLAY_LABELS.phaseLabels.source,
				DISPLAY_LABELS.phaseShortLabels.tokens ===
					DISPLAY_LABELS.phaseLabels.tokens,
			]).toEqual([true, false]);
		});
	});

	describe('the two keyspaces (Boundaries)', () => {
		it('the labels key against every lifecycle phase name and no other', () => {
			expect(
				Object.keys(DISPLAY_LABELS.phaseLabels).toSorted((left, right) =>
					left.localeCompare(right),
				),
			).toEqual(['ast', 'environment', 'evaluation', 'source', 'tokens']);
		});

		it('the framings key against every failable stage name and no other', () => {
			expect(
				Object.keys(DISPLAY_LABELS.causeFramings).toSorted((left, right) =>
					left.localeCompare(right),
				),
			).toEqual(['ast', 'entwined', 'environment', 'tokens']);
		});

		it('entwined is a framing key and not a label key', () => {
			expect([
				'entwined' in DISPLAY_LABELS.causeFramings,
				'entwined' in DISPLAY_LABELS.phaseLabels,
			]).toEqual([true, false]);
		});

		it('evaluation is a label key and not a framing key', () => {
			expect([
				'evaluation' in DISPLAY_LABELS.phaseLabels,
				'evaluation' in DISPLAY_LABELS.causeFramings,
			]).toEqual([true, false]);
		});
	});

	describe('what each family draws (Interfaces)', () => {
		it('each fit mark draws its learner-facing word', () => {
			expect(Object.values(DISPLAY_LABELS.fitMarks)).toEqual([
				'fits',
				'steps outside',
				'modules only',
				"can't tell yet",
			]);
		});

		it('the waiting standing draws not reached', () => {
			expect(DISPLAY_LABELS.standingWaiting).toBe('not reached');
		});

		it('the standing copy is one string rather than a record over the union', () => {
			expect(typeof DISPLAY_LABELS.standingWaiting).toBe('string');
		});

		it('the nameplate names the program on the editor arm', () => {
			expect(DISPLAY_LABELS.nameplateForms.editor).toBe('your code');
		});

		it('the lens and generator arms share the occupant form', () => {
			expect(DISPLAY_LABELS.nameplateForms.lens).toBe(
				DISPLAY_LABELS.nameplateForms.generator,
			);
		});

		it('the tray heading frames the phase label', () => {
			expect(DISPLAY_LABELS.trayHeading).toBe('ways to study the');
		});

		it('the proposals heading is one invariant string', () => {
			expect(DISPLAY_LABELS.proposalsHeading).toBe('next, you could:');
		});

		it('an empty station speaks its label with a comma, not the printed separator', () => {
			expect(DISPLAY_LABELS.emptyStationReasons.tokens).toBe(
				'Tokens, spelling: nothing studies this phase yet',
			);
		});

		it('the count line reads singular at one', () => {
			expect(DISPLAY_LABELS.emptyCountLines[1]).toBe(
				'one phase has nothing to open yet',
			);
		});

		it('the count line reads plural above one', () => {
			expect(DISPLAY_LABELS.emptyCountLines[4]).toBe(
				'four phases have nothing to open yet',
			);
		});

		it('the unreached count has no singular key to author', () => {
			expect(
				Object.keys(DISPLAY_LABELS.unreachedCountLines).toSorted(
					(left, right) => left.localeCompare(right),
				),
			).toEqual(['2', '3']);
		});
	});

	describe('the framings and the ordered ways out (Exceptions)', () => {
		it('a tokens failure frames the cause as a spelling break', () => {
			expect(DISPLAY_LABELS.causeFramings.tokens).toBe(
				'the spelling broke here',
			);
		});

		it('an ast failure frames the cause as a grammar break', () => {
			expect(DISPLAY_LABELS.causeFramings.ast).toBe('the grammar broke here');
		});

		it('an entwined failure blames the instrument rather than the program', () => {
			expect(DISPLAY_LABELS.causeFramings.entwined).toBe(
				'the machinery broke here, not your code',
			);
		});

		it('environment shares the machinery framing rather than authoring a fourth', () => {
			expect(DISPLAY_LABELS.causeFramings.environment).toBe(
				DISPLAY_LABELS.causeFramings.entwined,
			);
		});

		it('the three ways out order the repair before the escape', () => {
			expect(DISPLAY_LABELS.blockedWaysOut).toBe(
				'Fix the code, pick another level, or turn strict off.',
			);
		});

		it('no drawn string carries a machine token', () => {
			const drawn = [
				...Object.values(DISPLAY_LABELS.phaseLabels),
				...Object.values(DISPLAY_LABELS.fitMarks),
				...Object.values(DISPLAY_LABELS.causeFramings),
				DISPLAY_LABELS.standingWaiting,
				DISPLAY_LABELS.blockedWaysOut,
			].join(' ');
			expect(
				['does-not-fit', 'not-applicable-for-type', 'barring edge'].some(
					(token) => drawn.includes(token),
				),
			).toBe(false);
		});
	});

	describe('what it owns (Simple)', () => {
		it('freezes the record', () => {
			expect(Object.isFrozen(DISPLAY_LABELS)).toBe(true);
		});

		it('freezes each keyed family', () => {
			expect(
				[
					DISPLAY_LABELS.phaseLabels,
					DISPLAY_LABELS.phaseShortLabels,
					DISPLAY_LABELS.fitMarks,
					DISPLAY_LABELS.causeFramings,
				].every((family) => Object.isFrozen(family)),
			).toBe(true);
		});
	});
});
