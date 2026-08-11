/**
 * @file The module assembler — the pure core of danger's `module`-mode build.
 * Assembles ONE inline `<script type="module">` source string from (already
 * loop-guarded, already debugger-wrapped) user code plus the guard's counter
 * count. Unlike the script assembler (`build-danger-script.ts`) it wraps the
 * code in NO `try/catch` bridge and emits NO `"use strict"`: a module's
 * `import`/`export` must stay top-level, so module mode reports its natural end
 * through a trailing sentinel (`window.__danger.done();` as the last top-level
 * statement) and its errors through the window `error` / `unhandledrejection`
 * events (`run.ts`), never a bridge. Line-preserving: the `var loop1..loopK = 0;`
 * counter prefix carries no newline before the user code (legal before a
 * top-level `import`), so user line _N_ stays at line _N_ (DOCS.md § Structural
 * constraints).
 */

import buildCounters from './build-counters.js';

/**
 * Assemble the injectable module source for one danger run.
 *
 * The bridge the source calls — `window.__danger.done()` on natural completion —
 * is assigned onto the iframe's `window` by the runner BEFORE this module is
 * injected. A module cannot report a caught throw through a bridge (no wrapping
 * `try/catch`), so a throw surfaces on the window instead (`run.ts`'s listeners).
 *
 * @param code - The user source AFTER the loop-guard rewrite and (optional)
 *   debugger wrap — both line-preserving, so `code`'s line numbers are the
 *   learner's.
 * @param loopCount - The number of loops the guard instrumented; drives the
 *   `var loop1..loop{loopCount} = 0;` counter prefix (`0` emits none). The prefix
 *   is module-scoped, resolving the same bindings the spliced `++loopN` reference.
 * @returns The module source: the counter prefix (no newline before `code`) +
 *   `code` + a newline + `window.__danger.done();` as the final top-level
 *   statement. No `"use strict"`, no `try/catch`, no report bridge.
 */
export default function buildDangerModule(
	code: string,
	loopCount: number,
): string {
	// The counter prefix (shared with the script assembler via buildCounters) glued
	// before the user code with NO newline, then the user code, then the done()
	// sentinel on its own line below. No "use strict", no try/catch, no bridge.
	return `${buildCounters(loopCount)}${code}
window.__danger.done();`;
}
