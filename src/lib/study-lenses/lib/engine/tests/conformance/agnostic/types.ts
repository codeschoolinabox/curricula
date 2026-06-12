/**
 * @file The contract between the agnostic spec modules and their two
 * runners. Spec modules register describe blocks over a runner; the
 * runner owns transport injection and the worker entry URL. Spec
 * modules MUST call the runner only inside `it` bodies — never at
 * module evaluation time, never in shared describe-scope state.
 */

import type { EngineHandle, EvaluateSpec } from '../../../types.js';

type AgnosticRunner = {
	/** Names the transport in describe titles (`fake` / `real`). */
	readonly name: string;
	/** One run over this runner's transport, reference logic defaulted. */
	readonly run: (
		code: string,
		overrides?: Partial<EvaluateSpec>,
	) => EngineHandle;
};

export type { AgnosticRunner };
