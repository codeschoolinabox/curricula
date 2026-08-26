/**
 * @file intercept's thin worker entry: wires the engine's bootstrap to
 * intercept's own worker logic. This is the per-consumer entry the engine's
 * worker-factory pattern loads (engine README § Public API): the thread side
 * constructs
 * `new Worker(new URL('./worker-entry.ts', import.meta.url), { type: 'module' })`
 * as one adjacent, static expression — the URL stays a static literal, so
 * bundlers stay static; no dynamic URLs.
 *
 * Worker entries execute at module load by design: an entry IS the worker's
 * main(), not a library module. The bootstrap posts `ready` from here, which
 * is what the thread's handshake awaits.
 *
 * The engine-internal import is deliberate and scoped: engine internals stay
 * out of intercept's THREAD-side modules, where the seam boundary lives; a
 * worker entry is by definition the file that wires the bootstrap (the
 * deprecated entry's recorded ruling, human ruling 2026-07-30, R-5 —
 * carried).
 */

import bootstrap from '../../lib/engine/worker/bootstrap.js';

import interceptWorkerSetup from './intercept-worker-setup.js';

bootstrap(interceptWorkerSetup);
