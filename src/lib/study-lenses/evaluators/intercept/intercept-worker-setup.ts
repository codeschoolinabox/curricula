/**
 * @file intercept's worker logic: the setup the engine's bootstrap invokes
 * once at sandbox start (DOCS.md phases 3–5's worker half) — the guarded
 * worker base's shared opening plus intercept's own observation surface.
 *
 * The base answers the guard's injectable helpers and the registered halt
 * author in one call (`createGuardedWorkerBase`, human rulings
 * 2026-08-25/26); intercept PASSES A FINISHER — the per-evaluator seam —
 * which reads the wrap's stamped call site off the raw throw onto its own
 * halt shape, and emits the worker-sent in-stream error record (human
 * ruling 2026-08-26) immediately before the stop record is authored.
 *
 * The injected globals ARE the observation: a worker has no dialogs at all
 * — injection creates them — and its own console would escape observation,
 * so injection shadows it. The surface is: the guard helpers, the `__$lc`
 * loc-wrap helper (the wrap's one six-field stamp,
 * `wrap-call-expressions.ts`'s decode contract), the WHOLE-surface
 * record-only console trap (`method` an open string, human ruling
 * 2026-08-19 / HR-18), and the three dialog traps.
 *
 * A console call is EMIT-ONLY: one complete record, no round-trip. A
 * dialog ASKS FIRST — `api.call` blocks the worker for the whole
 * round-trip, which is what suspends the run — and only the answer's
 * arrival emits the record carrying what the program received. Mocks are
 * THREAD-side (`serveAsk`, mock-before-mint): the worker always asks.
 *
 * `step` is the event ordinal, 1-based, minted worker-side in one shared
 * sequence across every kind — records, asks, and the error record alike —
 * so a mocked dialog's ask consumes an ordinal the stream never delivers
 * (the ruled step gap).
 */

import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type {
	CallResponse,
	WorkerApi,
	WorkerSetupResult,
} from '../../lib/engine/types.js';
import createGuardedWorkerBase from '../lib/guarded-worker-base/create-guarded-worker-base.js';
import type { FinishHalt } from '../lib/guarded-worker-base/types.js';

import type {
	InterceptAskMessage,
	InterceptHalt,
	InterceptInteractionRequest,
	InterceptLoc,
	InterceptWireRecord,
	LimitTrip,
} from './types.js';

/**
 * Build one run's worker-side environment: guard helpers, the loc-wrap
 * helper, the trapped console, the three dialog traps, and the halt
 * author (the base's, finished with intercept's attributed call site).
 *
 * @param api - The engine's worker api: `emit` carries records, `call`
 *   carries asks — the synchronous round-trip that suspends the run.
 * @param workerConfig - The clone-transported `InterceptWorkerConfig`.
 *   Its `iterationLimit` rides to the base UNCHANGED — the base's cap
 *   reading owns the narrowing, and pass-through is the ruled cap policy
 *   (pin intercept:394): no clamp, no default, no finiteness gate.
 * @returns The globals to inject and the halt author to register — the
 *   author fires on EVERY worker-side stop, natural end and throw alike.
 */
export default function interceptWorkerSetup(
	api: WorkerApi,
	workerConfig: unknown,
): WorkerSetupResult {
	const run = createRunState();
	const base = createGuardedWorkerBase(
		workerConfig,
		buildFinisher(api, run, readColumnDeltas(workerConfig)),
	);

	// WHY the exemption: the console trap must stay a plain mutable surface —
	// a learner reassigning console.log disables its own observation and the
	// program continues (the deprecated setup's recorded reasoning, carried);
	// a deep freeze would turn that reassignment into a TypeError under the
	// engine's strict default, which is not the platform's behavior.
	const consoleTrap = buildConsoleTrap(api, run);
	return deepFreezeExcept(
		{
			globals: {
				...base.guardGlobals,
				__$lc: buildLocWrap(run),
				console: consoleTrap,
				alert: buildDialogTrap(api, run, 'alert'),
				confirm: buildDialogTrap(api, run, 'confirm'),
				prompt: buildDialogTrap(api, run, 'prompt'),
			},
			serializeHalt: base.serializeHalt,
		},
		new Set([consoleTrap]),
	);
}

/**
 * The stamp a propagating throw carries: the ENCODED six-field stamp of
 * the innermost wrapped call it escaped. In-file at both the stamp site
 * and the finisher's read site — never retyped (the marker-key
 * precedent).
 */
const LOC_STAMP_KEY = '__$callLoc';

/** The residual parse's `'function'`-path line base: two spec-pinned
 * dynamic-Function wrapper lines plus the strict prefix's one (the
 * kind's recorded strict collapse). */
const FUNCTION_PATH_LINE_BASE = 3;

type RunState = {
	/** The wrap's stack of ENCODED stamps; top = the executing call site. */
	readonly currentLocs: string[];
	/** The next EVENT ordinal — one shared sequence across every kind. */
	readonly nextStep: () => number;
};

type DialogKind = 'alert' | 'confirm' | 'prompt';

/** The wire attribution legs, both-or-neither (types.ts Seam 3). */
type AttributionLegs =
	| { readonly loc: InterceptLoc; readonly start: number; readonly end: number }
	| { readonly loc: null; readonly start: null; readonly end: null };

const NULL_ATTRIBUTION: AttributionLegs = { loc: null, start: null, end: null };

/**
 * One run's mutable worker state — the declared per-run exception (the
 * deprecated setup's current-loc stack, carried): closure-confined,
 * disposable, written only by the wrap's enter/exit and the event
 * authors.
 */
function createRunState(): RunState {
	const currentLocs: string[] = [];
	let step = 0;
	return {
		currentLocs,
		nextStep() {
			step += 1;
			return step;
		},
	};
}

/**
 * The per-evaluator finisher (the base's one seam): emit the worker-sent
 * error record for the learner's own run-ending throw — the trip and the
 * natural end emit nothing; the halt ends their timeline (human ruling
 * 2026-08-26, the ledger's in-stream-error bullet) — then widen the core
 * with the attributed call site read from the raw throw's stamp, or the
 * one sanctioned stack-parse position for the no-live-frame residual,
 * its column corrected worker-side (human ruling 2026-09-01). The
 * emission keys off the core's already-classified `trip`, never a
 * heuristic on the raw error (a forged guard message is an ordinary
 * learner throw). A defect anywhere in here degrades to the unfinished
 * core at the base's builder guard, never a lost halt.
 */
function buildFinisher(
	api: WorkerApi,
	run: RunState,
	columnDeltas: Readonly<Record<string, unknown>>,
): FinishHalt<InterceptHalt> {
	return function finishInterceptHalt(core, rawError): InterceptHalt {
		if (core.natural) {
			return { ...core, loc: null };
		}
		const encoded = readStampedEncoding(rawError);
		if (core.trip === null) {
			const legs =
				encoded === null ? NULL_ATTRIBUTION : decodeStampLegs(encoded);
			api.emit(buildErrorRecord(core.errorName, core.message, run, legs));
		}
		return {
			...core,
			loc: attributeThrow(core, encoded, rawError, columnDeltas),
		};
	};
}

/**
 * The throw arm's attribution, in the ruled precedence: a live wrapped
 * frame's stamp wins — and the halt needs only its SPAN, so a sound span
 * attributes the stop record even where the offset legs are corrupt (the
 * separate-leg validation, I1's recorded seam flag). A marked trip never
 * stack-parses: the trip record owns its attribution, and the loop's own
 * span is already the richer answer. Only the learner's no-live-frame
 * residual takes the one sanctioned stack parse (human ruling
 * 2026-08-19; the worker-side column correction, human ruling
 * 2026-09-01).
 */
function attributeThrow(
	core: { readonly trip: LimitTrip | null },
	encoded: string | null,
	rawError: unknown,
	columnDeltas: Readonly<Record<string, unknown>>,
): InterceptLoc | null {
	if (encoded !== null) {
		return decodeStampSpan(encoded);
	}
	if (core.trip !== null) {
		return null;
	}
	return parseResidualSpan(rawError, columnDeltas);
}

/** The wire error record, its step minted from the one shared sequence. */
function buildErrorRecord(
	name: string,
	message: string,
	run: RunState,
	stamp: AttributionLegs,
): InterceptWireRecord {
	return {
		event: 'error',
		name,
		message,
		step: run.nextStep(),
		...stamp,
	};
}

/**
 * The wrap protocol's helper (`__$lc`): push the ENCODED stamp, invoke,
 * stamp a propagating object-valued throw with that stamp (first write
 * wins — the innermost call it escaped), restore the stack on the way
 * out. No decode rides this per-call path.
 */
function buildLocWrap(run: RunState) {
	return function __$lc<T>(encodedLoc: string, call: () => T): T {
		// eslint-disable-next-line functional/immutable-data -- the per-run current-loc stack, the declared exception; written only here
		run.currentLocs.push(encodedLoc);
		try {
			return call();
		} catch (error) {
			stampThrow(error, encodedLoc);
			throw error;
		} finally {
			// eslint-disable-next-line functional/immutable-data -- the exit half of the same declared exception: restore on the way out
			run.currentLocs.pop();
		}
	};
}

/** First-write, non-enumerable, own-key stamp; a primitive throw — or an
 * exotic object refusing the define — rides unstamped. */
function stampThrow(thrown: unknown, encodedLoc: string): void {
	if (typeof thrown !== 'object' || thrown === null) {
		return;
	}
	try {
		if (Object.hasOwn(thrown, LOC_STAMP_KEY)) {
			return;
		}
		// eslint-disable-next-line functional/immutable-data -- the stamp IS the attribution's delivery channel (the guard marker's own precedent)
		Object.defineProperty(thrown, LOC_STAMP_KEY, {
			value: encodedLoc,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	} catch {
		// An exotic thrown object that refuses the stamp rides unstamped.
	}
}

/**
 * The WHOLE-surface record-only console trap (human ruling 2026-08-19 /
 * HR-18): any string-named method call records faithfully under its own
 * name — an exotic-but-legal call is a record, never a learner-shaped
 * failure — and nothing returns or forwards to the host console (the
 * record IS the observation). The proxy's target is the learner-writable
 * surface: a reassigned method is the learner disabling their own
 * observation, so an own property — the learner's write, or a cached
 * trap — always wins over minting a fresh recorder.
 */
function buildConsoleTrap(api: WorkerApi, run: RunState): object {
	const surface: Record<string, unknown> = {};
	return new Proxy(surface, {
		get(target, property) {
			if (typeof property !== 'string') {
				// eslint-disable-next-line unicorn/no-useless-undefined -- a proxy get must answer a value on every path (sonarjs consistent-return), and undefined IS the platform's answer for an absent symbol-keyed member
				return undefined;
			}
			if (Object.hasOwn(target, property)) {
				return target[property];
			}
			const recorder = buildConsoleRecorder(api, run, property);
			// eslint-disable-next-line functional/immutable-data -- caching the minted recorder as an own property keeps console.log === console.log, the platform's own identity
			target[property] = recorder;
			return recorder;
		},
	});
}

/** One method's emit-only recorder: one complete record, no round-trip. */
function buildConsoleRecorder(api: WorkerApi, run: RunState, method: string) {
	return function trapped(...callArguments: unknown[]): void {
		api.emit({
			event: 'console',
			method,
			args: cloneSafeArguments(callArguments),
			step: run.nextStep(),
			...currentAttribution(run),
		} satisfies InterceptWireRecord);
	};
}

/**
 * One dialog trap: decode the ask (the platform rules below), block on
 * the round-trip — the suspension itself — then emit the record carrying
 * what the program received, and hand that value back: ask first, record
 * after, never collapsed. Mocks are thread-side (`serveAsk`,
 * mock-before-mint): the trap always asks, and a mocked dialog's ask
 * consumes the step ordinal the stream never delivers.
 */
function buildDialogTrap(api: WorkerApi, run: RunState, kind: DialogKind) {
	return function dialogTrap(...callArguments: unknown[]): unknown {
		const attribution = currentAttribution(run);
		const answer = api.call({
			step: run.nextStep(),
			...attribution,
			request: decodeRequest(kind, callArguments),
		} satisfies InterceptAskMessage);
		const returnValue = modelReturnValue(kind, answer);
		api.emit({
			event: kind,
			args: cloneSafeArguments(callArguments),
			step: run.nextStep(),
			...attribution,
			return: returnValue,
		});
		return returnValue;
	};
}

/**
 * The request as the platform would render the dialog (the deprecated
 * setup's decode rules, transported): `alert` rides two overloads — no
 * argument is `''`, one argument converts (so an explicit `undefined`
 * renders `'undefined'`); `confirm`/`prompt` declare their message
 * optional-with-default, so an explicit `undefined` counts as omitted,
 * and the same rule makes `prompt`'s undefined default ABSENT.
 */
function decodeRequest(
	kind: DialogKind,
	callArguments: readonly unknown[],
): InterceptInteractionRequest {
	if (kind === 'alert') {
		const message = callArguments.length === 0 ? '' : String(callArguments[0]);
		return { kind, message };
	}
	const [rawMessage, rawDefault] = callArguments;
	const message =
		rawMessage === undefined
			? ''
			: // eslint-disable-next-line @typescript-eslint/no-base-to-string -- default stringification IS the browser dialog's own rendering of an object message
				String(rawMessage);
	if (kind === 'confirm') {
		return { kind, message };
	}
	return rawDefault === undefined
		? { kind, message }
		: {
				kind,
				message,
				// eslint-disable-next-line @typescript-eslint/no-base-to-string -- default stringification IS the browser dialog's own rendering of an object default
				defaultValue: String(rawDefault),
			};
}

/**
 * What the program receives back. The answer was validated per verb at
 * the thread-side boundary (`serveAsk`'s table, or the channel's), so
 * this models rather than re-validates: alert's answer is ignored —
 * `undefined` is the value the browser's own alert hands back (H-3,
 * carried) — confirm's boolean and prompt's string-or-null ride through.
 */
function modelReturnValue(
	kind: DialogKind,
	answer: CallResponse,
): CallResponse {
	// Declared-uninitialized IS alert's modelled undefined — its answer is
	// ignored, and the browser's own alert hands back nothing (H-3).
	let returnValue: CallResponse;
	if (kind !== 'alert') {
		returnValue = answer;
	}
	return returnValue;
}

/**
 * The RAW fact, made able to cross the boundary: an argument that
 * survives a structured clone rides as itself, and one that cannot — a
 * function, a symbol, anything holding one — rides as its string form,
 * so a boundary moment never crashes a run (the deprecated setup's
 * clone-safe rule, carried).
 */
function cloneSafeArguments(
	callArguments: readonly unknown[],
): readonly unknown[] {
	return callArguments.map((argument) => cloneSafeArgument(argument));
}

function cloneSafeArgument(argument: unknown): unknown {
	try {
		structuredClone(argument);
		return argument;
	} catch {
		return String(argument);
	}
}

/** The top of the wrap's stack, decoded only because this moment needs
 * it; all-null outside any wrap. */
function currentAttribution(run: RunState): AttributionLegs {
	const top = run.currentLocs.at(-1);
	return top === undefined ? NULL_ATTRIBUTION : decodeStampLegs(top);
}

/** The stamp's one read site off a throw: guarded like the guard's own
 * classifier — a trapping proxy is unattributed, never a worker crash. */
function readStampedEncoding(thrown: unknown): string | null {
	try {
		if (typeof thrown !== 'object' || thrown === null) {
			return null;
		}
		if (!Object.hasOwn(thrown, LOC_STAMP_KEY)) {
			return null;
		}
		const encoded = (thrown as Record<string, unknown>)[LOC_STAMP_KEY];
		return typeof encoded === 'string' ? encoded : null;
	} catch {
		return null;
	}
}

/**
 * `'L:C:L:C:S:E'` → the attribution legs (the wrap's decode contract:
 * the first four fields the span, the last two the offsets), or all
 * null — never a guess. The span and offset legs validate SEPARATELY
 * (I1's recorded seam flag): {@link decodeStampSpan} answers the halt,
 * which needs only the span, while a wire record's both-or-neither rule
 * makes a corrupt offset pair drop BOTH legs here.
 */
function decodeStampLegs(encoded: string): AttributionLegs {
	const loc = decodeStampSpan(encoded);
	if (loc === null) {
		return NULL_ATTRIBUTION;
	}
	const parts = encoded.split(':').map(Number);
	const [start, end] = [parts[4], parts[5]];
	if (!Number.isFinite(start) || !Number.isFinite(end)) {
		return NULL_ATTRIBUTION;
	}
	return { loc, start, end };
}

/** The stamp's SPAN leg alone — the halt's need: a sound span attributes
 * the stop record even where the offset legs are corrupt. Exactly six
 * fields, four finite span numbers, or null. */
function decodeStampSpan(encoded: string): InterceptLoc | null {
	const parts = encoded.split(':').map(Number);
	if (parts.length !== 6) {
		return null;
	}
	const spanParts = parts.slice(0, 4);
	if (!spanParts.every((part) => Number.isFinite(part))) {
		return null;
	}
	const [startLine, startColumn, endLine, endColumn] = spanParts as [
		number,
		number,
		number,
		number,
	];
	return {
		start: { line: startLine, column: startColumn },
		end: { line: endLine, column: endColumn },
	};
}

/**
 * The residual correction's config half, read once at setup. Reading
 * `unknown` is the narrowing, not a policy gate (readCap's own pattern in
 * the base): the record rides as opaque values and each per-line delta is
 * re-checked at its read, so a malformed member corrects nothing rather
 * than crashing a halt.
 */
function readColumnDeltas(
	workerConfig: unknown,
): Readonly<Record<string, unknown>> {
	// WHY the cast: workerConfig is clone-transported and contractually
	// unknown at the engine boundary; the member is re-checked here, not
	// trusted.
	const { spliceColumnDeltas } = (workerConfig ?? {}) as {
		readonly spliceColumnDeltas?: unknown;
	};
	return typeof spliceColumnDeltas === 'object' && spliceColumnDeltas !== null
		? (spliceColumnDeltas as Readonly<Record<string, unknown>>)
		: {};
}

/**
 * The one sanctioned stack parse (human ruling 2026-08-19), for the
 * learner throw no wrapped frame stamped: scan the raw error's stack for
 * the first frame that points into the learner's own code, subtract that
 * frame shape's harness line base, correct the column through the
 * config's per-line deltas (human ruling 2026-09-01), and answer a
 * zero-width original-space span — a position, not an extent. `null`
 * wherever the stack gives nothing: the residual is best-effort
 * attribution, never a guess.
 *
 * WHY the guard is local rather than the base's builder catch: the base
 * degrades a THROWING finisher to the unfinished CORE, whose
 * per-evaluator `loc` member does not exist at all — so relying on it
 * would deliver `loc: undefined`, never the contract's `null` (ar-3
 * 2026-09-01, the stack-getter row). Guarded like `readStampedEncoding`:
 * a trapping stack is unattributed, never a worker crash.
 */
function parseResidualSpan(
	rawError: unknown,
	columnDeltas: Readonly<Record<string, unknown>>,
): InterceptLoc | null {
	try {
		if (typeof rawError !== 'object' || rawError === null) {
			return null;
		}
		const { stack } = rawError as { readonly stack?: unknown };
		if (typeof stack !== 'string') {
			return null;
		}
		for (const frameLine of stack.split('\n')) {
			const position = parseFrameLine(frameLine, columnDeltas);
			if (position !== null) {
				return position;
			}
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * One stack line → the corrected position, or null for a line that is
 * not a learner-code frame: no trailing `:line:column`, no learner-code
 * marker (an engine or platform frame — which is also what keeps an
 * error MESSAGE line from false-matching), or a position above the
 * learner's own first line. Stack positions arrive 1-based in both
 * axes; the region's columns are 0-based, so the column shifts down one
 * before the delta correction.
 */
function parseFrameLine(
	frameLine: string,
	columnDeltas: Readonly<Record<string, unknown>>,
): InterceptLoc | null {
	const trailing = /:(\d+):(\d+)\)?\s*$/.exec(frameLine);
	if (trailing === null) {
		return null;
	}
	const lineBase = frameLineBase(frameLine);
	if (lineBase === null) {
		return null;
	}
	const stackLine = Number(trailing[1]);
	const stackColumn = Number(trailing[2]);
	const line = stackLine - lineBase;
	if (line < 1 || stackColumn < 1) {
		return null;
	}
	const column = correctColumn(columnDeltas, line, stackColumn - 1);
	return { start: { line, column }, end: { line, column } };
}

/**
 * The frame's harness line base, keyed by the learner-code marker the
 * frame carries. A dynamic-Function frame — V8 renders `<anonymous>`,
 * Firefox `> Function` — is the engine's `'function'` path: the
 * spec-pinned `new Function` wrapper costs two lines and the kind's
 * strict collapse a third (the bootstrap prepends `"use strict";\n`;
 * the collapse is recorded at the region root). A blob frame is the
 * `'module'` path, whose blob IS the code — line 1 is line 1. The
 * function markers test FIRST: a browser's dynamic-Function frame names
 * the constructing blob too, and the trailing position is the
 * function-space one.
 */
function frameLineBase(frameLine: string): number | null {
	if (frameLine.includes('<anonymous>') || frameLine.includes('> Function')) {
		return FUNCTION_PATH_LINE_BASE;
	}
	if (frameLine.includes('blob:')) {
		return 0;
	}
	return null;
}

/**
 * The ruled per-line correction: subtract the line's delta from the
 * column — splicing preserves lines and shifts columns, only on lines it
 * touched. An absent line, a malformed delta, or a delta larger than the
 * column corrects nothing: a position the delta provably cannot describe
 * passes through, never negative. Known approximation, stated at both
 * halves (the assembly side is `create-intercept-handle.ts`'s
 * `spliceColumnDeltasOf`): a line carrying more than one insertion gets
 * one summed delta, so a position between the insertions over-corrects —
 * the clamp above is what bounds that to best-effort attribution.
 */
function correctColumn(
	columnDeltas: Readonly<Record<string, unknown>>,
	line: number,
	column: number,
): number {
	const delta = columnDeltas[String(line)];
	if (
		typeof delta !== 'number' ||
		!Number.isFinite(delta) ||
		delta <= 0 ||
		column < delta
	) {
		return column;
	}
	return column - delta;
}
