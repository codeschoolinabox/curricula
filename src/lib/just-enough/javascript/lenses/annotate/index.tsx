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

import React, { useState } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import annotateCore from './core.js';
import type { ViewMode } from './types.js';


const AnnotateComponent: ComponentType<LensProperties> =
	function AnnotateComponent({ config }) {
		const resolved = annotateCore.config(config);
		// Clamp to a valid ViewMode: `config()` returns the open `LensConfig`,
		// so an educator override could carry any string. Anything other than
		// 'flowchart' degrades to 'code' (the always-applicable Tier-1 view).
		const initialView: ViewMode =
			resolved.defaultView === 'flowchart' ? 'flowchart' : 'code';
		const [viewMode] = useState<ViewMode>(initialView);

		return (
			<div data-lens="annotate" data-view-mode={viewMode}>
				<main data-view-mode={viewMode} />
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
