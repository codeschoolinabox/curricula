/**
 * @file PORTED — generated hints from the solution: the legacy `generateHints` +
 * `stripComments` (WritemeLens.jsx lines 292-402).
 *
 * Concept hints (regex matches, with `{match}` interpolated to the captured
 * identifier) FOLLOWED BY three structural hints, the combined list capped at 8
 * (concept-first — structural hints are dropped first when the cap bites). Two
 * pattern sets keyed on `keepComments`: implementation-focused (comments kept)
 * vs structure-focused (comments off — and the source is comment-stripped first,
 * so commented-out code yields no hints). ids: `hint_<n>` (concept) /
 * `structural_<n>` (structural).
 *
 * Port posture: mechanical conversion. The `Hint` carries no `revealed` flag —
 * reveal state is wrapper-internal (see `../types.ts`). This directory
 * (`lenses/writeme/lib/**`) is eslint-ignored per `eslint.config.mjs`.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { Hint } from '../types.js';

// Whole-code comment strip (legacy `stripComments`, WritemeLens.jsx lines
// 292-300) — applied only in comments-off mode so commented-out code yields no
// hints. Distinct from the per-line strip in `./code-lines.ts`.
function stripComments(code: string): string {
	let cleaned = code.replace(/\/\/.*$/gm, '');
	cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
	cleaned = cleaned.replace(/^\s*\n/gm, '');
	return cleaned;
}

/**
 * @param solution - the original source (`embodiment.source.code`).
 * @param keepComments - the lens's Keep-Comments setting (also selects the
 *   pattern set and whether the source is comment-stripped before matching).
 * @returns up to 8 frozen hints (concept hints first, then structural).
 */
function generateHints(
	solution: string,
	keepComments: boolean,
): ReadonlyArray<Hint> {
	const code = keepComments ? solution : stripComments(solution);
	const lines = code.split('\n').filter((line) => line.trim());
	const hints: Hint[] = [];

	const patterns: ReadonlyArray<{ regex: RegExp; hint: string }> = keepComments
		? [
				// Comments kept → focus on implementation details.
				{
					regex: /function\s+(\w+)/g,
					hint: 'Implement the function body for "{match}"',
				},
				{
					regex: /let\s+(\w+)/g,
					hint: 'Initialize the variable "{match}" with appropriate value',
				},
				{
					regex: /const\s+(\w+)/g,
					hint: 'Set the constant "{match}" to the correct value',
				},
				{ regex: /if\s*\(/g, hint: 'Add the condition for the if statement' },
				{ regex: /for\s*\(/g, hint: 'Complete the for loop syntax and body' },
				{ regex: /return\s+/g, hint: 'Return the calculated result' },
			]
		: [
				// Comments stripped → focus on structural guidance.
				{
					regex: /function\s+(\w+)/g,
					hint: 'Define a function named "{match}"',
				},
				{ regex: /let\s+(\w+)/g, hint: 'Declare a variable called "{match}"' },
				{ regex: /const\s+(\w+)/g, hint: 'Create a constant named "{match}"' },
				{ regex: /console\.log\(/g, hint: 'Add a console.log statement' },
				{ regex: /if\s*\(/g, hint: 'Add a conditional statement' },
				{ regex: /for\s*\(/g, hint: 'Create a for loop' },
				{ regex: /while\s*\(/g, hint: 'Add a while loop' },
				{ regex: /\.\w+\(/g, hint: 'Call a method on an object' },
				{ regex: /class\s+(\w+)/g, hint: 'Define a class called "{match}"' },
				{ regex: /=>\s*/g, hint: 'Use arrow function syntax' },
			];

	for (const pattern of patterns) {
		const matches = [...code.matchAll(pattern.regex)];
		for (const match of matches) {
			hints.push({
				id: `hint_${hints.length}`,
				text: pattern.hint.replace('{match}', match[1] || ''),
				type: 'concept',
			});
		}
	}

	const structuralHints: ReadonlyArray<{ text: string; type: 'structure' }> = [
		{
			text: `This program has ${lines.length} lines of code`,
			type: 'structure',
		},
		{ text: 'Think about the logical flow of the program', type: 'structure' },
		{ text: 'Consider what inputs and outputs are needed', type: 'structure' },
	];
	structuralHints.forEach((hint, index) => {
		hints.push({ id: `structural_${index}`, text: hint.text, type: hint.type });
	});

	// Limit to 8 hints max (concept-first; structural dropped first if it bites).
	return freezeInPlace(hints.slice(0, 8));
}

export default generateHints;
