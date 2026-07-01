/**
 * @file The variables tracer's thin worker entry: wires the engine bootstrap to
 * this tier's worker logic. Like every consumer entry it is the worker's
 * `main()`, not a library module — it executes at module load, and the bootstrap
 * posts `ready` from here for the thread's handshake (see
 * `engine/testing/test-worker-entry.ts`, the pattern this mirrors).
 */

import bootstrap from '../../../../../lib/engine/worker/bootstrap.js';

import variablesWorkerSetup from './variables-worker-setup.js';

bootstrap(variablesWorkerSetup);
