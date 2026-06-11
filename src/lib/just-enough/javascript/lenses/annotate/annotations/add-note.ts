import type { AnnotationSet, AnnotationsByView, Note, ViewMode } from '../types.js';
import replaceView from './replace-view.js';

/**
 * Appends a note to the active view's `AnnotationSet`.
 *
 * @param annotations - The current per-view annotation pair.
 * @param view - The active view the note belongs to.
 * @param note - The note to add.
 * @returns A deep-frozen new pair; the inactive view is reference-identical.
 */
export default function addNote(
	annotations: AnnotationsByView,
	view: ViewMode,
	note: Note,
): AnnotationsByView {
	const target = annotations[view];
	const updated: AnnotationSet = {
		strokes: target.strokes,
		notes: [...target.notes, note],
	};
	return replaceView(annotations, view, updated);
}
