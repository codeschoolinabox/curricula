/**
 * @file Pure-TS annotation state model for the `annotate` lens. The five
 * operations (`addStroke`, `removeStroke`, `addNote`, `removeNote`,
 * `clearView`) each take the full `AnnotationsByView` pair plus the
 * active `view`, and return a new pair with only the active view's
 * `AnnotationSet` changed.
 *
 * **Toggle-preserves-annotations invariant** (the load-bearing
 * pedagogical claim): every operation leaves the inactive view's
 * `AnnotationSet` reference-identical to its input value, so toggling
 * `viewMode` in the React wrapper never disturbs the other view's
 * strokes and notes. All five ops route their commit through
 * `replaceView`, the single site that enforces this. The core imports
 * no React; tests run in vitest without jsdom.
 *
 * @remarks Each op rebuilds only the changed array of the active view's
 * set and carries the untouched sibling array by reference (e.g.
 * `addStroke` keeps `notes` as-is). That shared reference is safe: the
 * prior frame's arrays are already frozen, so nothing can mutate them.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type {
	AnnotationSet,
	AnnotationsByView,
	Note,
	Stroke,
	ViewMode,
} from './types.js';

/**
 * Commits a new `AnnotationSet` for the active view, returning a frozen
 * pair. This is the single site where the **toggle-preserves-annotations
 * invariant** is enforced: the spread copies the inactive view's
 * reference unchanged, and `freezeInPlace` returns its input reference
 * (re-freezing the already-frozen inactive set is a no-op), so the
 * inactive entry stays `===` to the prior frame.
 */
function replaceView(
	annotations: AnnotationsByView,
	view: ViewMode,
	updated: AnnotationSet,
): AnnotationsByView {
	return freezeInPlace<AnnotationsByView>({ ...annotations, [view]: updated });
}

/**
 * Appends a stroke to the active view's `AnnotationSet`.
 *
 * @param annotations - The current per-view annotation pair.
 * @param view - The active view the stroke belongs to.
 * @param stroke - The finalized stroke to add.
 * @returns A deep-frozen new pair; the inactive view is reference-identical.
 */
function addStroke(
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

/**
 * Removes the stroke with the given id from the active view's
 * `AnnotationSet`. A missing id is a no-op on the strokes array.
 *
 * @param annotations - The current per-view annotation pair.
 * @param view - The active view to remove from.
 * @param strokeId - The id of the stroke to remove.
 * @returns A deep-frozen new pair; the inactive view is reference-identical.
 */
function removeStroke(
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

/**
 * Appends a note to the active view's `AnnotationSet`.
 *
 * @param annotations - The current per-view annotation pair.
 * @param view - The active view the note belongs to.
 * @param note - The note to add.
 * @returns A deep-frozen new pair; the inactive view is reference-identical.
 */
function addNote(
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

/**
 * Removes the note with the given id from the active view's
 * `AnnotationSet`. A missing id is a no-op on the notes array.
 *
 * @param annotations - The current per-view annotation pair.
 * @param view - The active view to remove from.
 * @param noteId - The id of the note to remove.
 * @returns A deep-frozen new pair; the inactive view is reference-identical.
 */
function removeNote(
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

/**
 * Clears both strokes and notes of the active view's `AnnotationSet`,
 * leaving the inactive view untouched.
 *
 * @param annotations - The current per-view annotation pair.
 * @param view - The active view to clear.
 * @returns A deep-frozen new pair; the inactive view is reference-identical.
 */
function clearView(
	annotations: AnnotationsByView,
	view: ViewMode,
): AnnotationsByView {
	const updated: AnnotationSet = { strokes: [], notes: [] };
	return replaceView(annotations, view, updated);
}

const annotationOps = {
	addStroke,
	removeStroke,
	addNote,
	removeNote,
	clearView,
};

export default annotationOps;
