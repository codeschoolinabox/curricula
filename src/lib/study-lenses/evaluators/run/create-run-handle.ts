/**
 * @file main's body: run's result-only source over the region's
 * execution-handle library, plus the eager echoes the library installs.
 *
 * The consumption laws — inert creation, two-touch ignition, the memoized
 * settle, idempotent out-of-band cancel — are the library's
 * (`../lib/execution-handle/README.md` § The laws); this file builds a
 * source and re-implements none of them. What run owns here is the seam
 * wiring (DOCS.md § Architectural sketch, phases 3–5): `start` splices
 * the guards on the ORIGINAL text, projects the machinery spec, and
 * begins the run; the `onCall` hook answers dialog asks through the
 * thread-side io resolver and records the io flag the settlement mapper
 * reads; `stop` is the machinery's cancel; `result` is the settlement
 * mapping's output. The fallback thunks are the two routes no engine
 * settlement can speak for: the inert cancel (nothing started) and the
 * broken source (run's unreachable-outcome defect, pin run:289) — both
 * TRUSTED seam members (library ruling 2026-09-01), so both are total.
 *
 * The gate is main's, not this file's: `index.ts` refuses the missing
 * environment and the spec outside the gate, narrowing the ast guarantee
 * once, at the door — this function trusts the narrowed `Program` it is
 * handed and reads the echoes once, at creation.
 */

import type { Program } from 'acorn';

import cloneAndFreeze from '@utils/clone-and-freeze.js';
import freezeInPlace from '@utils/freeze-in-place.js';

import DEFAULT_SECONDS from '../../lib/engine/default-seconds.js';
import evaluate from '../../lib/engine/evaluate.js';
import type { CallResponse, EngineHandle } from '../../lib/engine/types.js';
import createExecution from '../lib/execution-handle/create-execution.js';
import type { ResultOnlySource } from '../lib/execution-handle/types.js';
import spliceIterationGuards from '../lib/iteration-guard/splice-iteration-guards.js';

import mapSettlement from './map-settlement.js';
import resolveIo from './resolve-io.js';
import type {
	ResolvedRunOptions,
	RunHandle,
	RunIoFlag,
	RunIoRequest,
	RunResult,
	RunSpec,
	RunWorkerConfig,
} from './types.js';

/**
 * Assemble run's inert handle: the settle base plus the eager echoes.
 *
 * Construction executes nothing — laziness rides the first consumption
 * touch (`await` / `.then` / `.result`), and `cancel()` before any touch
 * settles the cancel outcome with nothing spawned. Reading `code`,
 * `ast`, or `options` observes and never ignites.
 *
 * @remarks
 * `options.seconds` is ALWAYS populated: the engine owns the default and
 * this file imports it, while the machinery spec carries `seconds` only
 * when the caller set it — same number, two duties. `iterations` and
 * `io` ride as given; the echoed io record is a frozen copy holding the
 * caller's own mock functions by reference, so creating a handle never
 * mutates caller data.
 *
 * @param spec - run's spec, already past main's door.
 * @param ast - The facts' parsed root, gate-narrowed by main; echoed by
 *   reference on the handle and on every result arm.
 * @returns The inert result-only handle.
 */
export default function createRunHandle(
	spec: RunSpec,
	ast: Program,
): RunHandle {
	const code = spec.facts.source.value;
	const options = resolveOptions(spec);
	const source = buildRunSource(spec, code, ast, options);

	return createExecution(source, function buildEchoes() {
		return { code, ast, options };
	});
}

/**
 * The options record the handle echoes: `seconds` always populated from
 * the machinery's own exported default, `iterations` and `io` only where
 * given. The io record is cloned before freezing because the caller owns
 * it (`cloneAndFreeze` keeps the mock functions by reference).
 */
function resolveOptions(spec: RunSpec): ResolvedRunOptions {
	return freezeInPlace<ResolvedRunOptions>({
		seconds: spec.seconds ?? DEFAULT_SECONDS,
		...(spec.iterations === undefined ? {} : { iterations: spec.iterations }),
		...(spec.io === undefined ? {} : { io: cloneAndFreeze(spec.io) }),
	});
}

/**
 * run's result-only source: the seam record the handle library drives.
 * `start` is phase 3 (assemble and go), `serveAsk` phase 4 (serve asks),
 * the settle wiring phase 5 (map exactly once) — the two closure cells
 * below are the seam state those phases share, each written once: the
 * engine handle at ignition (so `stop` can reach the machinery's
 * cancel), and the io flag at the first io failure (recorded where the
 * interrupted exchange is known — DOCS.md § Structural constraints; the
 * settlement mapper's precedence step 1 reads it). The cells ride
 * DEV.md § 8's stated exception — low-level code interfacing with
 * libraries that require stateful patterns: the library's source seam
 * hands `stop` no handle, and the machinery's call hook shares nothing
 * with the settle path but this closure.
 */
function buildRunSource(
	spec: RunSpec,
	code: string,
	ast: Program,
	options: ResolvedRunOptions,
): ResultOnlySource<RunResult> {
	let engine: EngineHandle | null = null;
	let ioFlag: RunIoFlag | null = null;
	let settleWith!: (settled: Promise<RunResult>) => void;
	const result = new Promise<RunResult>(function holdSettle(resolve) {
		settleWith = resolve;
	});

	/**
	 * Phase 3 — ignite: splice the guards on the original text, project
	 * the machinery spec, begin the run, and wire the settle. Accessing
	 * `.result` on the engine handle is what starts the machinery (its
	 * own ignition touch); awaiting it alone drains the run to
	 * settlement, which is run's whole consumption — run streams nothing.
	 */
	function startRun(): void {
		const guarded = spliceIterationGuards(code);
		const engineHandle = evaluate({
			code: guarded.code,
			// One syntactically adjacent expression, `{ type: 'module' }` kept —
			// both load-bearing for webpack's static worker detection (engine
			// types.ts, the workerFactory contract).
			workerFactory: () =>
				// eslint-disable-next-line unicorn/relative-url-style -- './worker-entry.ts' is the literal form the engine's workerFactory contract pins; a same-directory worker/entry pair (the deprecated run's ar-4 precedent) — dropping the prefix is untested territory for webpack's static specifier detection
				new Worker(new URL('./worker-entry.ts', import.meta.url), {
					type: 'module',
				}),
			workerConfig: projectWorkerConfig(spec),
			threadLogic: { onMessage: dropMessage, onCall: serveAsk },
			execution: spec.execution,
			// Pass through only when the caller set it — the machinery's own
			// default governs; the handle's echo imports the same number.
			...(spec.seconds === undefined ? {} : { seconds: spec.seconds }),
		});
		engine = engineHandle;
		settleWith(
			engineHandle.result.then(function settleRun({ settlement }) {
				// Phase 5 — settle: the mapper answers the precedence over the
				// carried data plus the one evaluator-owned input, the io flag.
				return mapSettlement(settlement, ioFlag, ast, options.seconds);
			}),
		);
	}

	/** The library's teardown word: the machinery's cancel, nothing else. */
	function stopRun(): void {
		engine?.cancel();
	}

	/**
	 * Phase 4 — serve asks: answer a dialog ask from the mocks through
	 * the thread-side resolver, which alone validates and classifies. An
	 * io failure records the flag, then throws: the throw ends the run
	 * through the machinery's call-error route, and the mapper's
	 * precedence step 1 answers with the recorded flag — the classified
	 * io error — never with this Error.
	 */
	async function serveAsk(request: unknown): Promise<CallResponse> {
		// WHY the cast: the ask was minted by run's own dialog trap
		// (types.ts Seam 3) and crossed the machinery's call channel
		// clone-safe; the wrapper owns answer validation, not request
		// re-validation.
		const resolution = await resolveIo(request as RunIoRequest, options.io);
		if (resolution.answered) {
			return resolution.answer;
		}
		ioFlag = resolution.flag;
		throw new Error(resolution.flag.message);
	}

	/** The pre-ignition cancel's settle: nothing started, nothing spawned. */
	function inertCancelResult(): RunResult {
		return freezeInPlace<RunResult>({ outcome: 'cancel', ok: false, ast });
	}

	/**
	 * The broken-source settle: no machine ran, so no machinery cause
	 * would be honest — `'unreachable-outcome'` (pin run:289). A trusted
	 * thunk must be total: the non-Error arm describes the thrown value
	 * by type only, because a `String(cause)` could itself throw and a
	 * throwing fallback hangs the settle (library § The laws).
	 */
	function sourceDefectResult(cause: unknown): RunResult {
		return freezeInPlace<RunResult>({
			outcome: 'error',
			ok: false,
			ast,
			error: {
				kind: 'defect',
				name: cause instanceof Error ? cause.name : 'Error',
				message:
					cause instanceof Error
						? cause.message
						: `run's source broke before the machinery could answer (a ${typeof cause} was thrown)`,
				cause: 'unreachable-outcome',
			},
		});
	}

	return {
		start: startRun,
		stop: stopRun,
		result,
		inertCancelResult,
		sourceDefectResult,
	};
}

/**
 * The clone-safe worker config: the spec's `iterations` rides through
 * UNCHANGED — no clamp, no default, no finiteness gate (pin run:235).
 */
function projectWorkerConfig(spec: RunSpec): RunWorkerConfig {
	return spec.iterations === undefined
		? {}
		: { iterationLimit: spec.iterations };
}

/**
 * The required onMessage hook, as a drop: run streams nothing and its
 * worker never emits — `undefined` is the engine's drop sentinel, so an
 * unexpected message is dropped and the worker resumes.
 */
function dropMessage(): undefined {
	return undefined;
}
