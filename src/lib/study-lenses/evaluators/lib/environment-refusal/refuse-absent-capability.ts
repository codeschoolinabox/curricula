/**
 * The decision leaf: given the two capability facts, build the region's ONE
 * environment-refusal wording, or answer null. Pure — reads no globals, so
 * the wording and the arm order are exhaustively testable with plain
 * fixtures (DEV.md's environment-boundary rule: the globals are read by the
 * wrapper, and the node/browser tiers cross that boundary by moving test
 * files, never by mocking). README.md carries the domain model; DOCS.md
 * carries the sketch this file follows.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { EvaluatorRefusal } from '../../types.js';

/** The two environment facts the machinery cannot run without. */
type HostCapabilities = {
	readonly worker: boolean;
	readonly sharedMemory: boolean;
};

/**
 * Word the environment refusal for whatever is absent.
 *
 * @param evaluatorName - The calling evaluator's `name`; the refusal
 *   sentence opens with it.
 * @param capabilities - The two facts, as read by the wrapper (or supplied
 *   directly by a test).
 * @returns The frozen environment refusal naming the FIRST missing
 *   capability — the worker before the shared memory, the order a reader
 *   wants them named — or `null` when both are present.
 */
export default function refuseAbsentCapability(
	evaluatorName: string,
	capabilities: HostCapabilities,
): EvaluatorRefusal | null {
	const missing = describeMissing(capabilities);
	if (missing === null) {
		return null;
	}
	return freezeInPlace<EvaluatorRefusal>({
		refused: true,
		reason: `${evaluatorName} needs ${missing} to sandbox a program; this environment has none`,
	});
}

/**
 * The two prerequisites, in the order a reader would want them named: a
 * worker to run in, then the shared memory its control channel lives on.
 */
function describeMissing(capabilities: HostCapabilities): string | null {
	if (!capabilities.worker) {
		return 'a Worker (this looks like server-side rendering or plain Node)';
	}
	if (!capabilities.sharedMemory) {
		return 'SharedArrayBuffer (the page is not cross-origin isolated — it needs COOP/COEP headers)';
	}
	return null;
}
