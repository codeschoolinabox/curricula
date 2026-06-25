import { describe, it, expect } from 'vitest';

import makeWebllmRuntime from '../webllm-runtime.js';

// Increment 4 — the opt-in WebLLM convenience runtime (zero-wiring path).
// Smallest unit: a hermetic SHAPE + NO-THROW smoke. Two properties are observable
// in Node without a real engine: (1) the zero-arg builder constructs without
// eagerly invoking the WebLLM engine — the reason it is a builder, not a
// top-level value; and (2) it returns a valid AithorRuntime.
//
// Triangulation ceiling: whether the WEBLLM adapter (vs none) was wired is NOT
// distinguishable at the loadModel return-value level in Node — both converge on
// no-model-available without a real WebGPU engine. That end-to-end wiring
// guarantee belongs to a browser integration test, not this unit. The adapter's
// engine is covered by local-llm's webllm-adapter tests; the value-not-throw load
// path by load-model.test.ts.

describe('makeWebllmRuntime', () => {
	describe('interface — builds a runtime without eagerly invoking the engine', () => {
		it('constructs without throwing (no engine created at build time)', () => {
			expect(() => makeWebllmRuntime()).not.toThrow();
		});

		it('returns an AithorRuntime exposing a loadModel function', () => {
			const runtime = makeWebllmRuntime();

			expect(typeof runtime.loadModel).toBe('function');
		});
	});
});
