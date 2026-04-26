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
 * Lifecycle (per DOCS §1, §2, §7):
 *
 * 1. Mount: `useMemo` constructs the per-instance registry/bus/cache.
 *    `useState` lazily builds the `OrchestratorState`. The effect runs
 *    once: validate → execute → resolve lens module → call `lens()`
 *    (sync or async) → attach `mount.el` to the host ref.
 * 2. Cancellation: if the component unmounts while `lens()` is in
 *    flight, the eventual mount is disposed and never attached.
 * 3. Unmount: detach `mountedElement`, `bus.clear()`, iterate
 *    `cache.visit(entry => entry.mount.dispose())`, then `cache.clear()`.
 *    The cache does not auto-dispose — caller (this effect) owns
 *    teardown per `create-lens-cache.ts`.
 *
 * SSR: wrapped in `<BrowserOnly>` per DOCS §Structural constraints; the
 * fallback is a `<pre>` of the raw code so non-JS readers still see the
 * snippet during server-render.
 *
 * Language guard: `lang !== 'js'` short-circuits the effect and renders
 * a banner above the raw code per DOCS §Language is JEJ-only.
 */

import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import createEventBus from '../create-event-bus.js';
import createLensCache from '../create-lens-cache.js';
import createOrchestratorState from '../create-orchestrator-state.js';
import executePipeline from '../execute-pipeline.js';
import validatePipeline from '../pipeline.js';
// eslint-disable-next-line unicorn/prevent-abbreviations -- contract type lives in types.ts and is off-limits in Increment 8
import type { Pipeline, PluginEmittedProps } from '../types.js';

import createDefaultRegistry from './default-registry.js';

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

	const [state] = useState(function initialState() {
		return createOrchestratorState({
			originalCode: code,
			initialLens: lens,
			initialTransforms: transforms?.split(',').filter(Boolean) ?? [],
		});
	});
	const [error, setError] = useState<Error | null>(null);

	useEffect(function mountActiveLens() {
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
				const mount =
					cached ?? (await lensModule.lens(transformedCode, cfg));
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
			bus.clear();
			cache.visit(function disposeEntry(entry) {
				entry.mount.dispose();
			});
			cache.clear();
		};
	}, [state, registry, bus, cache, langOk]);

	if (!langOk) {
		return (
			<div data-orchestrator="study-lenses">
				<div data-orchestrator-banner="" role="alert">
					study-lenses only supports lang=&quot;js&quot; (got &quot;{lang}&quot;)
				</div>
				<pre>{code}</pre>
			</div>
		);
	}
	if (error) {
		return <pre data-orchestrator-error="">{error.message}</pre>;
	}
	return <div ref={hostReference} data-orchestrator="study-lenses" />;
}

export default StudyLenses;
