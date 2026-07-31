/**
 * Shared test doubles for the generator view's suite. DEV.md § Test Data bans
 * shared *data* — every seed, prompt, and result stays inline per test — not a
 * factory for a collaborator the suite is obliged to inject: the view's props
 * REQUIRE a socket, so every render must hand one over.
 *
 * Grows per increment. The mount (inc 2) never asks, so it needs only a socket
 * that proves it never asked; the job flow (inc 3) adds a scripted socket that
 * announces stages and resolves, and cancel (inc 4) adds an abortable one.
 */

import type { GeneratorSocket } from '../types.js';

// The mount seats its seed and stops — no ask leaves it. So this double answers
// nothing and throws instead: a stray effect or an eager ask at mount detonates
// with a named error rather than passing quietly on a resolution nobody reads.
// (The same move as local-llm's `registeredAdapter`, for the same reason.)
export function unaskedSocket(): GeneratorSocket {
	return {
		generate() {
			throw new Error('unaskedSocket: the view asked, and this mount must not');
		},
	};
}
