/**
 * @file Package entry point for the tracer module.
 *
 * Assembles the TracerModule from static data and the record function,
 * wires it into @study-lenses/tracing, and re-exports the resulting
 * trace wrappers. Wire-up only — do not add logic here.
 */

import tracing from '@study-lenses/tracing';
import type { RecordFunction } from '@study-lenses/tracing';

import id from './id.js';
import langs from './langs.js';
import optionsSchema from './options-schema.js';
import record from './record/index.js';
import deepFreeze from '@utils/deep-freeze.js';
import verifyOptions from './verify-options/index.js';

/**
 * The raw TracerModule wired into @study-lenses/tracing.
 *
 * Exposed for introspection (e.g. `tracer.id`, `tracer.langs`) or for use in
 * custom wrappers. Most consumers use the pre-bound wrappers (`trace`, `embody`,
 * etc.) rather than calling `record()` directly.
 */
const tracer = Object.freeze({
	id,
	langs: Object.freeze(langs),
	// WHY: cast through unknown — record signature changed from
	// RecordFunction to async generator in Phase 3. This old
	// integration point will be removed when the @study-lenses/tracing
	// dependency is dropped.
	record: record as unknown as RecordFunction,
	optionsSchema: deepFreeze(optionsSchema),
	verifyOptions,
});

const { trace, tracify, embody, embodify } = tracing(tracer);

export { trace, tracify, embody, embodify };

export { tracer };

export default trace;
