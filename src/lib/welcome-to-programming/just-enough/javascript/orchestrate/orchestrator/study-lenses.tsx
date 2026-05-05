/**
 * @file Increment-8 React wrapper for `<StudyLenses>`. Wires the Phase-1
 * pure-TS substrate (registry, pipeline validate/execute, orchestrator
 * state, EventBus, lens cache) to a React host that mounts the resolved
 * lens.
 *
 * @remarks Scope is intentionally narrow: scaffolding only. No toolbar,
 * no lens picker, no transform toggle, no reset buttons. Those land in
 * Increments 9–14. The single observable behavior here is: a `js:editor`
 * fence renders a `<div data-orchestrator="study-lenses">` with the
 * resolved lens's `el` attached inside it.
 *
 * Lifecycle (per DOCS §1, §2, §7 and `orchestrator/DOCS.md` §Effect topology):
 *
 * 1. Mount: `useMemo` constructs the per-instance registry/bus/cache.
 *    `useState` lazily builds the `OrchestratorState`. The mount-effect
 *    runs once: validate → execute → resolve lens module → call `lens()`
 *    (sync or async) → attach `mount.el` to the host ref.
 * 2. Cancellation: if the component unmounts while `lens()` is in
 *    flight, the eventual mount is disposed and never attached.
 * 3. Switch (Increment 9+): a state-identity change re-runs the
 *    mount-effect. Its cleanup detaches `mountedElement` WITHOUT
 *    disposing — the cached entry survives so a future switch-back
 *    reattaches the cached `mount.el` instead of remounting.
 * 4. Unmount: a separate effect (`disposeOnUnmount`) owns the full
 *    teardown: `bus.clear()`, `cache.visit(entry => entry.mount.dispose())`,
 *    then `cache.clear()`. Runs once on real component unmount only.
 *    Splitting this from the mount-effect cleanup is what makes
 *    cache-hit reattach work across switches.
 *
 * SSR: wrapped in `<BrowserOnly>` per DOCS §Structural constraints; the
 * fallback is a `<pre>` of the raw code so non-JS readers still see the
 * snippet during server-render.
 *
 * Language guard: `lang !== 'js'` short-circuits the effect and renders
 * a banner above the raw code per DOCS §Language is JEJ-only.
 */

import BrowserOnly from '@docusaurus/BrowserOnly';
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import createEventBus from '../create-event-bus.js';
import createLensCache from '../create-lens-cache.js';
import createOrchestratorState from '../create-orchestrator-state.js';
import executePipeline from '../execute-pipeline.js';
import validatePipeline from '../pipeline.js';
// eslint-disable-next-line unicorn/prevent-abbreviations -- contract type lives in types.ts and is off-limits in Increment 8
import type { Pipeline, PluginEmittedProps } from '../types.js';

import createDefaultRegistry from './default-registry.js';
import Toolbar from './toolbar.js';

function StudyLenses(properties: PluginEmittedProps): React.JSX.Element {
	return (
		<BrowserOnly fallback={<pre>{properties.code}</pre>}>
			{function renderClient() {
				return <StudyLensesClient {...properties} />;
			}}
		</BrowserOnly>
	);
}

function StudyLensesClient(properties: PluginEmittedProps): React.JSX.Element {
	const { code, lens = 'editor', lang = 'js', transforms } = properties;
	const langOk = lang === 'js';

	const hostReference = useRef<HTMLDivElement | null>(null);
	const registry = useMemo(createDefaultRegistry, []);
	const bus = useMemo(createEventBus, []);
	const cache = useMemo(createLensCache, []);

	const [state, setState] = useState(function initialState() {
		return createOrchestratorState({
			originalCode: code,
			initialLens: lens,
			initialTransforms: transforms?.split(',').filter(Boolean) ?? [],
		});
	});
	const [error, setError] = useState<Error | null>(null);
	const previousLensReference = useRef<string | null>(null);

	const onLensChange = useCallback(function transitionLens(
		nextLens: string,
	): void {
		setState(function applyLensChange(previousState) {
			if (previousState.activeLens === nextLens) return previousState;
			return freezeInPlace({ ...previousState, activeLens: nextLens });
		});
	}, []);

	useEffect(
		function disposeOnUnmount() {
			return function cleanup(): void {
				bus.clear();
				cache.visit(function disposeEntry(entry) {
					entry.mount.dispose();
				});
				cache.clear();
			};
		},
		[bus, cache],
	);

	useEffect(
		function mountActiveLens() {
			const noop = function noopCleanup(): void {};
			if (!langOk) return noop;
			let cancelled = false;
			let mountedElement: HTMLElement | null = null;

			async function run(): Promise<void> {
				try {
					const pipeline: Pipeline = {
						transforms: state.activeTransforms,
						lens: state.activeLens,
					};
					const validated = validatePipeline(pipeline, registry);
					const { transformedCode, resolvedLens } = executePipeline(
						state.snippet,
						validated,
						registry,
					);
					const lensModule = registry.getLens(resolvedLens);
					if (!lensModule) {
						throw new Error(`No lens module: ${resolvedLens}`);
					}
					const cfg = lensModule.config();
					const cached = cache.get(resolvedLens, cfg);
					const mount = cached ?? (await lensModule.lens(transformedCode, cfg));
					if (cancelled) {
						if (!cached) mount.dispose();
						return;
					}
					if (!cached) cache.set(resolvedLens, cfg, mount);
					if (hostReference.current) {
						hostReference.current.append(mount.el);
						mountedElement = mount.el;
					}
				} catch (caughtError) {
					if (!cancelled) setError(caughtError as Error);
				}
			}
			void run();

			return function cleanup(): void {
				cancelled = true;
				mountedElement?.remove();
			};
		},
		[state, registry, cache, langOk],
	);

	useEffect(
		function dispatchSwitch() {
			if (previousLensReference.current === null) {
				previousLensReference.current = state.activeLens;
				return;
			}
			if (previousLensReference.current === state.activeLens) return;
			bus.dispatch('lens-switched', {
				previous: previousLensReference.current,
				next: state.activeLens,
			});
			previousLensReference.current = state.activeLens;
		},
		[state.activeLens, bus],
	);

	if (!langOk) {
		return (
			<div data-orchestrator="study-lenses">
				<div data-orchestrator-banner="" role="alert">
					study-lenses only supports lang=&quot;js&quot; (got &quot;{lang}
					&quot;)
				</div>
				<pre>{code}</pre>
			</div>
		);
	}
	if (error) {
		return <pre data-orchestrator-error="">{error.message}</pre>;
	}
	const lensOptions = registry.getLensNames();
	return (
		<div data-orchestrator-root="">
			<Toolbar
				value={state.activeLens}
				options={lensOptions}
				onLensChange={onLensChange}
			/>
			<div ref={hostReference} data-orchestrator="study-lenses" />
		</div>
	);
}

export default StudyLenses;
