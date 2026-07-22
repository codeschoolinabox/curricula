/**
 * @file The script assembler — the pure core of the danger runner's build phase.
 * Assembles ONE `<script>` string from (already loop-guarded, already
 * debugger-wrapped) user code plus the guard's counter count, line-preservingly:
 * the `"use strict"`, the `var loop1..loopK = 0` counter globals the guard
 * REFERENCES but does not declare, and the `try/catch` + `__danger` bridge all sit
 * on a single prefix segment with NO newline before the user code, so user line _N_
 * stays at script line _N_ (DOCS.md § Structural constraints; mirrors embody's
 * `create-worker-script.ts` `"use strict"`-line technique). Error identity is read
 * INSIDE the iframe realm (`e && e.name` / `e && e.message`) and handed out as
 * primitives — a cross-realm `instanceof` in the parent is unsound.
 */

import buildCounters from './build-counters.js';

/**
 * Assemble the injectable `<script>` text for one danger run.
 *
 * The bridge the script calls — `window.__danger.done()` on natural completion,
 * `window.__danger.fail(name, message)` in the top-level `catch` — is assigned onto
 * the iframe's `window` by the runner BEFORE this script is injected.
 *
 * @param code - The user source AFTER the loop-guard rewrite and (optional)
 *   debugger wrap — both line-preserving, so `code`'s line numbers are the
 *   learner's.
 * @param loopCount - The number of loops the guard instrumented (its returned
 *   `loopCount`). `buildCounters` emits `var loop1 = 0, …, loop{loopCount} = 0;`
 *   because the loop-guard's spliced `++loopN` reference those counters but do not
 *   declare them; `0` emits no declaration. NEVER hardcoded.
 * @returns One script string: `"use strict";` + the counter globals + `try { ` +
 *   `code` + the `__danger.done()` / `catch → __danger.fail(...)` bridge, adding no
 *   newline above the user code (zero line shift).
 */
export default function buildDangerScript(
	code: string,
	loopCount: number,
): string {
	// One prefix segment, no newline before `code` (zero line shift); the tail is
	// glued after the last user line. The `var loop1..loopK = 0;` counter globals
	// (referenced by the guard's spliced `++loopN`, not declared by it) are the
	// shared `counters` prefix. Error identity read in-realm via `e && e.*`.
	return `"use strict"; ${buildCounters(loopCount)}try { ${code} window.__danger.done(); } catch (e) { window.__danger.fail(e && e.name, e && e.message); }`;
}
