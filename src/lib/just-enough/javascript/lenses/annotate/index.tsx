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

import React, { useMemo, useState } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import annotateCore from './core.js';
import deriveCodeSpanTree from './render-code.js';
import type { ViewMode } from './types.js';

import './annotate.css';


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
