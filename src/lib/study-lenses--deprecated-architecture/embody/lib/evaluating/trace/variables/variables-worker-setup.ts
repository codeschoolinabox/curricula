/**
 * @file The variables tracer's worker logic (Run-and-emit phase, DOCS.md § 4).
 *
 * The engine bootstrap calls this setup once per run, handing it the worker
 * `api` and the spec's `workerConfig` — which for this tier IS the
 * {@link ScopeTable} (clone-transported, contractually `unknown`, cast by use,
 * the pattern `engine/testing/reference-worker-setup.ts` establishes). The setup
 * returns the globals injected around the instrumented code (the `__$vr` helper
 * namespace plus the inert dialog stubs) and the {@link import('../../../../../lib/engine/types.js').SerializeHalt}
 * that authors the typed halt.
 *
 * The `__$vr` namespace implements the helper protocol the instrumentation
 * (increment 2) emits calls against (types.ts seam 3). Each value-bearing helper
 * runs the spliced thunks at the spec-correct moment, snapshots the live value,
 * emits the COMPLETE clone-safe lifecycle event (so the thread logic stays
 * stateless), and returns the ORIGINAL value so program semantics are untouched.
 *
 * @remarks This module holds the run's only mutable state (DOCS.md § "The worker
 * holds the only mutable state"): a monotonic step counter, a scope-instance
 * counter, the abrupt-completion flag (seam 4), and the registry — a stack of
 * scope-instance frames, each carrying its bindings' current values. The stack
 * is sound because the instrumentation wraps every scope in
 * `{ open; try {…} finally { close } }`, so opens and closes are strictly LIFO,
 * and JEJ is closure-free, so the runtime stack always mirrors lexical nesting.
 * State is closed over per `setup()` call (a worker module is one disposable
 * run), hence the file-level mutable-data disable below.
 *
 * Binding events (`initialize` / `read` / `assign` / `increment`) carry the
 * HOME scope instance of the named binding — the frame that declares it, found
 * by scanning the stack for the innermost match — so a binding's whole life
 * shares one `scopeInstanceId` (types.ts `VariablesEventBase`). The abrupt flag
 * is the sole authority for a scope-pop reason: set before a break/continue and
 * by the scope wrap's catch (`'error'`), cleared by every value-bearing helper
 * on success and by every `open` and `landed`, read but NEVER cleared by `close`
 * (one break unwinds several scopes, all reporting the same reason).
 */

/* eslint-disable functional/immutable-data -- the worker registry, counters, and abrupt flag are this module's declared mutable run-state (DOCS.md § "one declared mutable module"); same posture as engine/worker/bootstrap.ts and intercept/create-worker-script.ts */

import type {
	HaltKind,
	WorkerApi,
	WorkerSetupResult,
} from '../../../../../study-lenses/lib/engine/types.js';

import type {
	AbruptReason,
	AssignOperator,
	BindingKind,
	BindingStatus,
	FinalVariable,
	NodePath,
	ScopeKind,
	ScopeTable,
	ValueSnapshot,
	VariablesHelpers,
	VariablesTraceEvent,
} from './types.js';

/** A binding's live state within a frame. */
type BindingState = {
	kind: BindingKind;
	status: BindingStatus;
	value?: ValueSnapshot;
};

/** One live scope instance: its identity, kind, and its bindings' state. */
type Frame = {
	readonly scopePath: NodePath;
	readonly instanceId: number;
	readonly scopeKind: ScopeKind;
	readonly bindings: Map<string, BindingState>;
};

/**
 * Builds the worker logic for one run: the `__$vr` helpers over fresh run-state,
 * the inert dialog stubs, and the halt author.
 *
 * @param api - The engine worker api; this tier uses only `api.emit`.
 * @param workerConfig - The spec's worker config: this tier's {@link ScopeTable}.
 * @returns The globals to inject and the halt serializer.
 */
export default function variablesWorkerSetup(
	api: WorkerApi,
	workerConfig: unknown,
): WorkerSetupResult {
	// WHY the cast: workerConfig is clone-transported and contractually unknown
	// at the engine boundary; the scope-table shape is this tier's own.
	const scopeTable = (workerConfig ?? {}) as ScopeTable;

	// ─── run-state (the one declared mutable module) ───
	const stack: Frame[] = [];
	let stepCounter = 0;
	let instanceCounter = 0;
	let abruptReason: AbruptReason | null = null;

	function nextStep(): number {
		stepCounter += 1;
		return stepCounter;
	}

	function emit(event: VariablesTraceEvent): void {
		api.emit(event);
	}

	/** The innermost live frame declaring `name` (its home scope), if any. */
	function homeFrame(name: string): Frame | undefined {
		let match: Frame | undefined;
		for (const frame of stack) {
			if (frame.bindings.has(name)) {
				match = frame; // later == deeper, so the last match is innermost
			}
		}
		return match;
	}

	/** The innermost live frame's instance id — a defensive fallback only. */
	function currentInstanceId(): number {
		return stack.at(-1)?.instanceId ?? 0;
	}

	const helpers: VariablesHelpers = {
		open(scopePath) {
			const entry = scopeTable[scopePath];
			const scopeKind: ScopeKind = entry?.scopeKind ?? 'block';
			const bindings = new Map<string, BindingState>();
			for (const variable of entry?.variables ?? []) {
				bindings.set(variable.name, { kind: variable.kind, status: 'tdz' });
			}
			const instanceId = instanceCounter;
			instanceCounter += 1;
			stack.push({ scopePath, instanceId, scopeKind, bindings });
			abruptReason = null;
			emit({
				event: 'scope-push',
				step: nextStep(),
				nodePath: scopePath,
				scopeInstanceId: instanceId,
				scopeKind,
				// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles `[...<Map>]` to `[<Map>]`; Array.from survives.
				variables: Array.from(bindings).map(([name, state]) => ({
					name,
					kind: state.kind,
				})),
			});
		},

		close(scopePath) {
			const frame = stack.pop();
			if (!frame) {
				return; // defensive: an unbalanced close cannot occur with LIFO wraps
			}
			const reason = abruptReason ?? 'normal'; // close READS, never clears
			emit({
				event: 'scope-pop',
				step: nextStep(),
				nodePath: scopePath,
				scopeInstanceId: frame.instanceId,
				scopeKind: frame.scopeKind,
				reason,
				// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles `[...<Map>]` to `[<Map>]`; Array.from survives.
				variables: Array.from(frame.bindings).map(([name, state]) =>
					finalVariable(name, state),
				),
			});
		},

		abrupt(reason) {
			abruptReason = reason; // 'break' | 'continue' | 'error' (seam 4)
		},

		landed() {
			abruptReason = null; // kill a flag left set by a final-iteration jump
		},

		initialize(nodePath, name, value, explicit) {
			const snap = snapshot(value);
			const frame = homeFrame(name);
			const binding = frame?.bindings.get(name);
			if (binding) {
				binding.status = 'initialized';
				binding.value = snap;
			}
			abruptReason = null;
			emit({
				event: 'initialize',
				step: nextStep(),
				nodePath,
				scopeInstanceId: frame?.instanceId ?? currentInstanceId(),
				name,
				value: snap,
				explicit,
			});
			return value;
		},

		read(nodePath, name, thunk) {
			const value = stampOnThrow(nodePath, thunk); // TDZ → stamped, rethrown, no event
			const frame = homeFrame(name);
			abruptReason = null;
			emit({
				event: 'read',
				step: nextStep(),
				nodePath,
				scopeInstanceId: frame?.instanceId ?? currentInstanceId(),
				name,
				value: snapshot(value),
			});
			return value;
		},

		assign(nodePath, name, operator, priorThunk, writerThunk, incoming) {
			const prior = stampOnThrow(nodePath, priorThunk);
			const wrote = isLogicalAssign(operator)
				? logicalWrote(operator, prior)
				: true;
			// The writer runs the real assignment (const target → TypeError →
			// stamped, rethrown, no event); a short-circuited logical writer
			// returns the prior without evaluating its right-hand side.
			const result = stampOnThrow(nodePath, () => writerThunk(incoming));
			const frame = homeFrame(name);
			const scopeInstanceId = frame?.instanceId ?? currentInstanceId();
			const priorValue = snapshot(prior);
			abruptReason = null;
			if (wrote) {
				const nextValue = snapshot(result);
				const binding = frame?.bindings.get(name);
				if (binding) {
					binding.status = 'initialized';
					binding.value = nextValue;
				}
				emit({
					event: 'assign',
					step: nextStep(),
					nodePath,
					scopeInstanceId,
					name,
					operator,
					priorValue,
					nextValue,
					wrote: true,
				});
			} else {
				emit({
					event: 'assign',
					step: nextStep(),
					nodePath,
					scopeInstanceId,
					name,
					operator,
					priorValue,
					wrote: false,
				});
			}
			return result;
		},

		increment(nodePath, name, operator, form, priorThunk, writerThunk) {
			const prior = stampOnThrow(nodePath, priorThunk);
			const returned = stampOnThrow(nodePath, writerThunk); // runs the real x++/--x
			const next = priorThunk(); // re-read the just-written (now-initialized) binding
			const frame = homeFrame(name);
			const nextValue = snapshot(next);
			const binding = frame?.bindings.get(name);
			if (binding) {
				binding.status = 'initialized';
				binding.value = nextValue;
			}
			abruptReason = null;
			emit({
				event: 'increment',
				step: nextStep(),
				nodePath,
				scopeInstanceId: frame?.instanceId ?? currentInstanceId(),
				name,
				operator,
				form,
				priorValue: snapshot(prior),
				nextValue,
				returnedValue: snapshot(returned),
			});
			return returned;
		},
	};

	return Object.freeze({
		globals: Object.freeze({
			__$vr: Object.freeze(helpers),
			prompt: () => null,
			confirm: () => false,
			// eslint-disable-next-line unicorn/no-useless-undefined -- the inert stub mirrors window.alert's undefined return
			alert: () => undefined,
		}),
		serializeHalt: serializeVariablesHalt,
	});
}

/** Builds a scope-pop final variable; `value` is present iff initialized. */
function finalVariable(name: string, state: BindingState): FinalVariable {
	return state.status === 'initialized'
		? { name, kind: state.kind, status: 'initialized', value: state.value }
		: { name, kind: state.kind, status: 'tdz' };
}

/**
 * A clone-safe snapshot of a live value: clone-safe values ride as themselves;
 * functions and other non-cloneable values (realm objects) become a tagged
 * {@link import('./types.js').OpaqueValue}. Mirrors intercept's `safeCloneArgs`.
 *
 * For clone-safe values this returns the live reference (the engine deep-clones
 * at `emit`); the registry therefore stores that reference, so a `scope-pop`
 * reflects the value's final state. JEJ values are primitive-dominated and the
 * tier does not track object mutation, so this is sound for the bounded context.
 */
function snapshot(value: ValueSnapshot): ValueSnapshot {
	if (typeof value === 'function') {
		return { opaqueValue: true, typeOf: 'function' };
	}
	try {
		structuredClone(value);
		return value;
	} catch {
		return { opaqueValue: true, typeOf: typeof value };
	}
}

/**
 * Runs `thunk`; on a throw, stamps the source `nodePath` onto the error (once,
 * defensively) before rethrowing, so the halt author can attribute a TDZ read
 * or const reassignment to its exact node. Mirrors intercept's `__$ic`.
 */
function stampOnThrow<T>(nodePath: NodePath, thunk: () => T): T {
	try {
		return thunk();
	} catch (error) {
		if (
			error !== null &&
			typeof error === 'object' &&
			(error as { __nodePath?: unknown }).__nodePath === undefined
		) {
			try {
				(error as { __nodePath?: unknown }).__nodePath = nodePath;
			} catch {
				/* frozen error — leave unattributed */
			}
		}
		throw error;
	}
}

/** Whether an assignment operator is one of the short-circuiting logical forms. */
function isLogicalAssign(operator: AssignOperator): boolean {
	return operator === '??=' || operator === '||=' || operator === '&&=';
}

/**
 * Whether a logical assignment writes, derived from the operator and the prior
 * value — never by comparing values (types.ts `AssignEvent`). `??=` writes when
 * the prior is nullish; `||=` when falsy; `&&=` when truthy.
 */
function logicalWrote(operator: AssignOperator, prior: ValueSnapshot): boolean {
	if (operator === '??=') {
		return prior === null || prior === undefined;
	}
	const truthy = Boolean(prior);
	return operator === '&&=' ? truthy : !truthy;
}

/**
 * The tier's worker-side halt author (engine `SerializeHalt`). Fires on every
 * worker-side stop. Reads the `__nodePath` stamped by the value helpers,
 * mirroring intercept's serializeHalt; null-safe for non-Error throws.
 */
function serializeVariablesHalt(kind: HaltKind, rawError: unknown): unknown {
	if (kind === 'natural-end') {
		return { natural: true, errorName: '', message: '', nodePath: null };
	}
	const errorName = rawError instanceof Error ? rawError.name : 'Error';
	const message =
		rawError instanceof Error ? rawError.message : String(rawError);
	const nodePath =
		rawError !== null &&
		typeof rawError === 'object' &&
		typeof (rawError as { __nodePath?: unknown }).__nodePath === 'string'
			? (rawError as { __nodePath: string }).__nodePath
			: null;
	return { natural: false, errorName, message, nodePath };
}
