/**
 * @file The debug-props `Lens` object (default export) and its thin
 * component: a readable dump of what a lens receives, rendered from the
 * pure core's props summary. Always applicable, no declared phase —
 * panel-excluded, mounted by explicit request only.
 *
 * Selector contract (data attributes; label text is never an anchor):
 * `data-lens="debug-props"` + `data-debug-props` on the root;
 * `data-debug-panel="facts" | "study" | "config"` on the panels;
 * `data-fact-stage="<stage>"` / `data-study-phase="<phase>"` on the
 * entries, each a `<dt>`/`<dd>` group; the config panel renders JSON in
 * `<pre>` — text only, never markup.
 */

import React from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { Lens, LensProperties } from '../types.js';

import summarize from './core.js';

function DebugPropertiesMain({
	embodiment,
	config,
}: LensProperties): React.JSX.Element {
	const summary = summarize(embodiment, config);
	return (
		<article data-debug-props data-lens="debug-props">
			<section data-debug-panel="facts">
				<h3>facts</h3>
				<dl>
					{summary.facts.map((entry) => (
						<div data-fact-stage={entry.stage} key={entry.stage}>
							<dt>{`${entry.stage} · ${entry.ok ? 'ok' : 'failed'}`}</dt>
							<dd>{entry.ok ? entry.description : entry.causeMessage}</dd>
						</div>
					))}
				</dl>
			</section>
			<section data-debug-panel="study">
				<h3>study</h3>
				<dl>
					{summary.study.map((entry) => (
						<div data-study-phase={entry.phase} key={entry.phase}>
							<dt>{`${entry.phase} · ${entry.accessible ? 'accessible' : 'barred'}`}</dt>
							<dd>
								{entry.lenses.length === 0 ? '(none)' : entry.lenses.join(', ')}
							</dd>
							{entry.accessible ? null : <dd>{entry.causeMessage}</dd>}
						</div>
					))}
				</dl>
			</section>
			<section data-debug-panel="config">
				<h3>config</h3>
				<pre>
					{Object.keys(summary.config).length === 0
						? '(empty)'
						: JSON.stringify(summary.config, null, 2)}
				</pre>
			</section>
		</article>
	);
}

function isAlwaysApplicable(): boolean {
	return true;
}

const debugPropertiesLens: Lens = freezeInPlace<Lens>({
	name: 'debug-props',
	label: 'see what this view is handed',
	applicability: isAlwaysApplicable,
	main: DebugPropertiesMain,
});

export default debugPropertiesLens;
