/**
 * @file The engine's own thin worker entry: wires the bootstrap to the
 * reference worker logic. This is the thin-entry pattern every
 * consumer follows — a few lines, statically bundleable.
 *
 * Worker entries execute at module load by design: an entry IS the
 * worker's main(), not a library module. The bootstrap posts `ready`
 * from here, which is what the thread's handshake awaits.
 */

import bootstrap from '../worker/bootstrap.js';

import referenceWorkerSetup from './reference-worker-setup.js';

bootstrap(referenceWorkerSetup);
