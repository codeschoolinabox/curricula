/**
 * @file Engine-owned trivial worker logic for the engine's own suites.
 * The engine cannot test itself against the JEJ tracers (they are a
 * separate, parallel campaign workflow) — this reference setup is the
 * worker-side half of that independence.
 *
 * Behavior is driven entirely by the clone-safe `workerConfig` so ONE
 * worker entry serves every test scenario: failure modes (invalid
 * global key, throwing setup, throwing halt serializer), the
 * worker-global installation channel, and the default happy path that
 * injects `emit` / `call` / `getConfig` globals.
 */

import type { SerializeHalt, WorkerApi, WorkerSetupResult } from '../types.js';

/**
 * The reference worker setup: injects trivial `emit`, `call`, and
 * `getConfig` globals delegating to the worker api, and authors halts
 * that stamp `viaReference` and recognize the reference limit-throw
 * shape (an error named `ReferenceLimitError`).
 *
 * @remarks Config directives (all optional, clone-safe):
 * - `throwInSetup` — setup throws (worker-error downstream)
 * - `invalidGlobalKey` — include this invalid key in the globals
 * - `omitSerializeHalt` — exercise the engine's default halt author
 * - `throwInSerializeHalt` — the serializer throws (worker crash)
 * - `installWorkerGlobal: { name, value }` — install state on
 *   `globalThis` (the lookup channel, distinct from param injection)
 */
export default function referenceWorkerSetup(
	api: WorkerApi,
	workerConfig: unknown,
): WorkerSetupResult {
	// WHY the cast: workerConfig is clone-transported and contractually
	// unknown at the engine boundary; the directive shape is this
	// module's own, validated by use, not by tsc.
	const config = (workerConfig ?? {}) as ReferenceConfig;

	if (config.throwInSetup) {
		throw new Error('reference setup throw');
	}
	if (config.installWorkerGlobal) {
		// eslint-disable-next-line functional/immutable-data -- installing worker-global state IS the channel under test
		(globalThis as Record<string, unknown>)[config.installWorkerGlobal.name] =
			config.installWorkerGlobal.value;
	}

	const globals: Record<string, unknown> = {
		emit: api.emit,
		call: api.call,
		getConfig: function getConfig(): unknown {
			return workerConfig;
		},
		...(config.invalidGlobalKey === undefined
			? {}
			: { [config.invalidGlobalKey]: true }),
	};

	if (config.omitSerializeHalt) {
		return Object.freeze({ globals: Object.freeze(globals) });
	}
	return Object.freeze({
		globals: Object.freeze(globals),
		serializeHalt: buildReferenceSerializer(config),
	});
}

type ReferenceConfig = {
	readonly throwInSetup?: boolean;
	readonly invalidGlobalKey?: string;
	readonly omitSerializeHalt?: boolean;
	readonly throwInSerializeHalt?: boolean;
	readonly installWorkerGlobal?: {
		readonly name: string;
		readonly value: unknown;
	};
};

/**
 * Stamps `viaReference` on every halt and `isReferenceLimit` on throws
 * whose error is named `ReferenceLimitError` — the engine-owned stand-in
 * for consumer-side limit classification.
 */
function buildReferenceSerializer(config: ReferenceConfig): SerializeHalt {
	return function serializeReferenceHalt(kind, rawError): unknown {
		if (config.throwInSerializeHalt) {
			throw new Error('reference serializer throw');
		}
		if (kind === 'natural-end') {
			return { kind, name: 'natural-end', message: '', viaReference: true };
		}

		const name = rawError instanceof Error ? rawError.name : 'Error';
		const message =
			rawError instanceof Error ? rawError.message : String(rawError);
		return {
			kind,
			name,
			message,
			viaReference: true,
			isReferenceLimit: name === 'ReferenceLimitError',
		};
	};
}
