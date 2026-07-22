/**
 * @file The counter-globals prefix — the `var loop1..loopK = 0;` declarations
 * danger's loop-guard REFERENCES (via its spliced `++loopN` bodies) but does not
 * itself declare. Extracted so both program assemblers — the script assembler
 * (`build-danger-script.ts`) and, later, the module assembler — emit a
 * byte-identical counter prefix from one source of truth. Line-preserving: a
 * single segment ending in one trailing space with NO newline, so user line _N_
 * stays at line _N_ (DOCS.md § Structural constraints).
 */

/**
 * Build the `var loop1 = 0, …, loop{loopCount} = 0; ` counter-declaration prefix
 * the loop-guard's spliced `++loopN` statements resolve against.
 *
 * @param loopCount - The number of loops the guard instrumented (its returned
 *   `loopCount`). `0` ⇒ the empty string (no `var` emitted); NEVER hardcoded.
 * @returns `''` when `loopCount` is 0, else `var loop1 = 0, …; ` — one `var`
 *   statement, dense 1-based ids, a single trailing space, and no newline
 *   (zero line shift).
 */
export default function buildCounters(loopCount: number): string {
	// Dense 1-based ids, comma-joined into ONE `var` statement. loopCount 0 →
	// empty declarations → '' (no `var` emitted).
	const declarations = Array.from(
		{ length: loopCount },
		(_, index) => `loop${index + 1} = 0`,
	).join(', ');
	return declarations === '' ? '' : `var ${declarations}; `;
}
