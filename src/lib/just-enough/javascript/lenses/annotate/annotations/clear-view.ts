import type { AnnotationSet, AnnotationsByView, ViewMode } from '../types.js';
import replaceView from './replace-view.js';

/**
 * Clears both strokes and notes of the active view's `AnnotationSet`,
 * leaving the inactive view untouched.
 *
 * @param annotations - The current per-view annotation pair.
 * @param view - The active view to clear.
 * @returns A deep-frozen new pair; the inactive view is reference-identical.
 */
export default function clearView(
	annotations: AnnotationsByView,
	view: ViewMode,
): AnnotationsByView {
	const updated: AnnotationSet = { strokes: [], notes: [] };
	return replaceView(annotations, view, updated);
}
