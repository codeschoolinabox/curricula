/**
 * @file Test fixture — a worker entry that throws at module load, so the
 * engine's pre-ready worker-load-failure path (`listenUntilReady`'s `error`
 * listener in `worker/transport.ts`, which settles `worker-error` with name
 * `EngineWorkerError`) keeps coverage. Not a real consumer entry: the bundler
 * resolves it (the file exists), and the browser fires the worker's `error`
 * event when this throw runs during module evaluation.
 */
export default function failAtLoad(): never {
	throw new Error(
		'deliberate module-load failure — exercises the worker error-event path',
	);
}

failAtLoad();
