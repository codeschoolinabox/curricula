/**
 * @file run's thin worker entry: wires the engine's bootstrap to run's own
 * worker logic. This is the per-consumer entry every engine consumer ships —
 * a few lines, statically bundled, loaded by the one adjacent module-worker
 * expression in `create-run-stream.ts`.
 *
 * Worker entries execute at module load by design: an entry IS the worker's
 * main(), not a library module. The bootstrap posts `ready` from here, which
 * is what the thread's handshake awaits.
 *
 * The engine-internal import is deliberate and scoped: D1 keeps engine
 * internals out of run's THREAD-side modules, where the seam it protects
 * lives; a worker entry is by definition the file that wires the bootstrap
 * (human ruling 2026-07-30, R-5).
 */

import bootstrap from '../../lib/engine/worker/bootstrap.js';

import runWorkerSetup from './run-worker-setup.js';

bootstrap(runWorkerSetup);
