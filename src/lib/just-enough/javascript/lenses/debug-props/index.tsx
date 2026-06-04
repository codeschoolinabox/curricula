/**
 * @file React wrapper for the `debug-props` meta-lens. Default-exports
 * the `LensModule` the orchestrator's lens registry consumes.
 *
 * The wrapper renders a `<div data-lens="debug-props">` root containing
 * one `<section data-debug-panel="<key>">` per panel produced by the
 * pure-TS core. Each panel renders its content inside `<pre>` so
 * multi-line stringified objects display verbatim and arbitrary
 * sandbox-harness fence content is treated as opaque text (never
 * `dangerouslySetInnerHTML`).
 *
 * Tier-1 (`applicableTo: () => true`) and recommender-inert
 * (`recommend: () => []`) by design — debug-props is a harness /
 * development surface, not a pedagogical one.
 */

import React from 'react';
import type { ComponentType } from 'react';

import type { LensConfig, LensModule, LensProps as LensProperties, Snippet } from '../types.js';

import deriveDisplayTree from './core.js';


const DebugPropertiesComponent: ComponentType<LensProperties> =
	function DebugPropertiesComponent_({ embodiment, config }) {
		const tree = deriveDisplayTree(embodiment, config);
		return (
			<div data-lens="debug-props">
				{tree.panels.map(function renderPanel(panel) {
					return (
						<section key={panel.key} data-debug-panel={panel.key}>
							<h3>{panel.label}</h3>
							<pre>{panel.content}</pre>
						</section>
					);
				})}
			</div>
		);
	};

const debugPropertiesLens: LensModule = Object.freeze({
	name: 'debug-props',
	Component: DebugPropertiesComponent,
	config: function debugPropertiesConfig(
		overrides?: Partial<LensConfig>,
	): LensConfig {
		// `Partial<LensConfig>` admits `undefined` values under
		// `exactOptionalPropertyTypes`, which `LensConfig` (Record of
		// `SerializableValue`) does not. Spread + freeze + cast: the
		// freeze guards downstream mutation; the cast acknowledges the
		// type contract requires the caller to not pass `undefined`
		// values (TypeScript prevents at the call site).
		return Object.freeze({ ...overrides }) as LensConfig;
	},
	applicableTo: function debugPropertiesApplicableTo(_embodiment: Snippet): boolean {
		return true;
	},
	recommend: function debugPropertiesRecommend(_embodiment: Snippet) {
		return [];
	},
});

export default debugPropertiesLens;
