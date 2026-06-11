import type { AnnotationSet, AnnotationsByView, ViewMode } from '../types.js';
import replaceView from './replace-view.js';

/**
 * Removes the stroke with the given id from the active view's
 * `AnnotationSet`. A missing id is a no-op on the strokes array.
 *
 * @param annotations - The current per-view annotation pair.
 * @param view - The active view to remove from.
 * @param strokeId - The id of the stroke to remove.
 * @returns A deep-frozen new pair; the inactive view is reference-identical.
 */
export default function removeStroke(
	annotations: AnnotationsByView,
	view: ViewMode,
	strokeId: string,
): AnnotationsByView {
	const target = annotations[view];
	const updated: AnnotationSet = {
		strokes: target.strokes.filter((stroke) => stroke.id !== strokeId),
		notes: target.notes,
	};
	return replaceView(annotations, view, updated);
}
