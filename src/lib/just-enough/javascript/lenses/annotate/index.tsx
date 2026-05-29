/**
 * @file React wrapper for the `annotate` lens. Default-exports the frozen
 * `LensModule` the orchestrator's lens registry consumes. The wrapper
 * composes the pure-TS core subsystems (`render-code`, `render-flowchart`,
 * `annotations`) into the annotation surface: a `<div data-lens="annotate"
 * data-view-mode="…">` root with a toolbar, the active view, a drawing /
 * notes overlay, and a note-input dialog.
 *
 * The `config`, `applicableTo`, and `recommend` fields come from
 * `./core.js`; the wrapper owns only the per-mount UI state and rendering.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import annotateCore from './core.js';
import deriveCodeSpanTree from './render-code.js';
import deriveFlowchartSvg from './render-flowchart.js';
import type { FlowchartSvg, ViewMode } from './types.js';

import './annotate.css';

/**
 * Renders the flowchart-view's loading / error / ready state. The ready
 * branch injects the `js2flowchart` SVG via `dangerouslySetInnerHTML` —
 * the lens's only such call-site, fed a trusted local library's output
 * (no learner-controlled markup) per `./DOCS.md` § Structural constraints.
 */
function renderFlowchartView(
	flowchart: FlowchartSvg,
	containerReference: React.RefObject<HTMLDivElement | null>,
): React.JSX.Element {
	if (flowchart.status === 'loading') {
		return <div data-flowchart-status="loading">Generating flowchart…</div>;
	}
	if (flowchart.status === 'error') {
		return (
			<div data-flowchart-status="error" role="alert">
				{flowchart.message}
			</div>
		);
	}
	return (
		<div
			data-flowchart-status="ready"
			ref={containerReference}
			dangerouslySetInnerHTML={{ __html: flowchart.svg }}
		/>
	);
}


const AnnotateComponent: ComponentType<LensProperties> =
	function AnnotateComponent({ embodiment, config }) {
		const resolved = annotateCore.config(config);
		// Clamp to a valid ViewMode: `config()` returns the open `LensConfig`,
		// so an educator override could carry any string. Anything other than
		// 'flowchart' degrades to 'code' (the always-applicable Tier-1 view).
		const initialView: ViewMode =
			resolved.defaultView === 'flowchart' ? 'flowchart' : 'code';
		const [viewMode] = useState<ViewMode>(initialView);

		// Colorize is default-on: only an explicit `false` disables Prism
		// tokenization, so a malformed value keeps the documented default.
		const colorize = resolved.colorize !== false;
		const codeTree = useMemo(
			() => deriveCodeSpanTree(embodiment.source.code, colorize),
			[embodiment.source.code, colorize],
		);

		const [flowchart, setFlowchart] = useState<FlowchartSvg>({
			status: 'loading',
		});
		const flowchartReference = useRef<HTMLDivElement>(null);

		// Generate the flowchart only while it is the active view. The
		// `cancelled` flag (set by the cleanup) drops a resolved-after-unmount
		// or resolved-after-toggle-away setState — the async-cleanup invariant.
		useEffect(
			function generateFlowchart() {
				let cancelled = false;
				if (viewMode === 'flowchart') {
					setFlowchart({ status: 'loading' });
					void deriveFlowchartSvg(embodiment.source.code).then(
						function applyResult(result) {
							if (!cancelled) setFlowchart(result);
						},
					);
				}
				return function cancel() {
					cancelled = true;
				};
			},
			[viewMode, embodiment.source.code],
		);

		// Post-inject tagging: walk the freshly injected SVG and tag each node
		// group with `data-flowchart-node` so React event delegation (Inc 7c)
		// resolves clicks via `closest('[data-flowchart-node]')`. The one
		// permitted DOM mutation — attribute-tagging only, never structural.
		useEffect(
			function tagFlowchartNodes() {
				if (flowchart.status !== 'ready') return;
				const container = flowchartReference.current;
				if (!container) return;
				// Pitfall #14: Babel emits unstable code for [...iterable] under the
				// Docusaurus build; keep Array.from on NodeList iterators.
				// eslint-disable-next-line unicorn/prefer-spread -- see note above
				const shapes = Array.from(
					container.querySelectorAll<SVGElement>('rect, polygon, circle'),
				);
				let nodeIndex = 0;
				for (const shape of shapes) {
					const group = shape.closest('g') ?? shape;
					if (group.dataset.flowchartNode === undefined) {
						// DOCS-sanctioned post-inject tag; attribute-only DOM mutation.
						// eslint-disable-next-line functional/immutable-data -- see above
						group.dataset.flowchartNode = String(nodeIndex);
						nodeIndex += 1;
					}
				}
			},
			[flowchart],
		);

		return (
			<div data-lens="annotate" data-view-mode={viewMode}>
				<main data-view-mode={viewMode}>
					{viewMode === 'code' && (
						<pre>
							<code>
								{codeTree.lines.map(function renderLine(line, lineIndex) {
									return (
										<React.Fragment key={lineIndex}>
											{lineIndex > 0 && '\n'}
											{line.map(function renderSpan(span, spanIndex) {
												return (
													<span
														key={`${lineIndex}-${spanIndex}`}
														className={span.className}
													>
														{span.text}
													</span>
												);
											})}
										</React.Fragment>
									);
								})}
							</code>
						</pre>
					)}
					{viewMode === 'flowchart' &&
						renderFlowchartView(flowchart, flowchartReference)}
				</main>
			</div>
		);
	};

const annotateLens: LensModule = freezeInPlace<LensModule>({
	name: 'annotate',
	Component: AnnotateComponent,
	config: annotateCore.config,
	applicableTo: annotateCore.applicableTo,
	recommend: annotateCore.recommend,
});

export default annotateLens;
