/**
 * @file The danger-only `debugger;` wrap — a pure, line-preserving string
 * transform folded into the danger runner (danger-only, so no separate
 * `orchestrate/lib/debugging`). A learner with devtools open steps straight into
 * their program; inert without devtools. Loop-guard instrumentation stays
 * deliberately VISIBLE in the stepped source (navigating a guard teaches what a
 * guard is). See DOCS.md § Internal pure helpers and § Structural constraints
 * (line preservation).
 */

/**
 * Wrap `code` with a `debugger;` statement above and below, line-preservingly.
 *
 * When `enabled` is false this is a no-op passthrough. When true, the leading
 * `debugger; ` is GLUED to the first line — no newline before the user code, so
 * user line _N_ stays at line _N_ — and a trailing `debugger;` follows the last
 * line on its own line, shifting nothing above it. The runner applies this to
 * already-guarded source (the guard rewrite is itself line-preserving and runs
 * first), so the counter instrumentation is visible when stepping.
 *
 * @param code - The (already loop-guarded) user source.
 * @param enabled - The dock's danger-only debugger flag; false ⇒ passthrough.
 * @returns `code` unchanged when disabled, else `debugger; ${code}` then a
 *   newline and a trailing `debugger;`.
 */
export default function wrapWithDebugger(
	code: string,
	enabled: boolean,
): string {
	// Leading `debugger; ` glued (no newline before `code`, so line N stays line N);
	// trailing `debugger;` on its own line below. No trimming of `code` — a trailing
	// blank line is an ordinary preserved line, and a learner's own `debugger;` stays
	// visible.
	return enabled ? `debugger; ${code}\ndebugger;` : code;
}
