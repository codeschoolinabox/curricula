import type {
	AnnotationSet,
	AnnotationsByView,
	Stroke,
	ViewMode,
} from '../types.js';
import replaceView from './replace-view.js';

/**
 * Appends a stroke to the active view's `AnnotationSet`.
 *
 * @param annotations - The current per-view annotation pair.
 * @param view - The active view the stroke belongs to.
 * @param stroke - The finalized stroke to add.
 * @returns A deep-frozen new pair; the inactive view is reference-identical.
 */
export default function addStroke(
	annotations: AnnotationsByView,
	view: ViewMode,
	stroke: Stroke,
): AnnotationsByView {
	const target = annotations[view];
	const updated: AnnotationSet = {
		strokes: [...target.strokes, stroke],
		notes: target.notes,
	};
	return replaceView(annotations, view, updated);
}
