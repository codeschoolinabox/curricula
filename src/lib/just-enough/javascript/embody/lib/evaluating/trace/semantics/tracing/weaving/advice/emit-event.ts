/**
 * @file Wraps createTraceEvent + state.trace.push + state.step increment.
 *
 * Single entry point for emitting a trace event from any advice function.
 * Extracts source metadata from the JejTag, creates the frozen event,
 * increments the step counter, pushes to the trace array, and optionally
 * streams via state.onEvent (set by worker setup for postMessage streaming).
 */

import createTraceEvent from '../../event-generators/create-trace-event.js';

import type { TracerState, JejTag } from '../types.js';

/**
 * Emits a trace event: increments step, creates frozen event, pushes to trace.
 *
 * @param state - Mutable tracer state
 * @param tag - JejTag with source metadata (loc, node, source)
 * @param semantics - 'expression' or 'statement'
 * @param generatorPath - Dot-separated path to event generator (e.g., 'literals.string')
 * @param payload - Domain-specific data for the generator
 */
export default function emitEvent(
	state: TracerState,
	tag: JejTag,
	semantics: 'expression' | 'statement',
	generatorPath: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload shape varies by generator
	payload: any,
): void {
	state.step += 1;
	state.eventStep += 1;
	const metadata = {
		step: state.eventStep,
		semantics,
		loc: tag.loc,
		node: tag.node,
		source: tag.source,
	};
	const event = createTraceEvent(metadata, generatorPath, payload);
	state.trace.push(event);
	state.onEvent?.(event);
}
