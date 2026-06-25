/**
 * @file The opt-in WebLLM convenience runtime — the canonical zero-wiring path
 * for a browser host.
 *
 * @remarks
 * The SOLE aithor-side place that wires the WebLLM backend: it builds the default
 * runtime with local-llm's webllm adapter registered, so a browser host needs no
 * adapter wiring of its own — `aithor(program, config, makeWebllmRuntime())`.
 *
 * A zero-arg BUILDER, not a top-level value: the heavy `@mlc-ai/web-llm`
 * dependency — pulled in TRANSITIVELY via {@link makeWebllmAdapter}, local-llm's
 * sole direct importer of it (this file never names `@mlc-ai/web-llm`) — is
 * constructed only when a host calls this, not at import time. `makeWebllmAdapter()`
 * builds the adapter closure without invoking the engine; the engine is created
 * lazily on first load. aithor's core (loader, factory, orchestrator) stays
 * backend-agnostic; this is the one module a host opts into for WebLLM.
 */
import makeWebllmAdapter from '../../../../lib/local-llm/webllm-adapter.js';

import makeAithorRuntime from './make-aithor-runtime.js';
import type { AithorRuntime } from './types.js';

export default function makeWebllmRuntime(): AithorRuntime {
	return makeAithorRuntime({ adapters: { webllm: makeWebllmAdapter() } });
}
