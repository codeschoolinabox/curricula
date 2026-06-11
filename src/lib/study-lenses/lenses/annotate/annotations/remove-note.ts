import type { AnnotationSet, AnnotationsByView, ViewMode } from '../types.js';
import replaceView from './replace-view.js';

/**
 * Removes the note with the given id from the active view's
 * `AnnotationSet`. A missing id is a no-op on the notes array.
 *
 * @param annotations - The current per-view annotation pair.
 * @param view - The active view to remove from.
 * @param noteId - The id of the note to remove.
 * @returns A deep-frozen new pair; the inactive view is reference-identical.
 */
export default function removeNote(
	annotations: AnnotationsByView,
	view: ViewMode,
	noteId: string,
): AnnotationsByView {
	const target = annotations[view];
	const updated: AnnotationSet = {
		strokes: target.strokes,
		notes: target.notes.filter((note) => note.id !== noteId),
	};
	return replaceView(annotations, view, updated);
}
