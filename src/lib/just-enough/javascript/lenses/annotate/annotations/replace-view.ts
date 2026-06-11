import freezeInPlace from '@utils/freeze-in-place.js';

import type { AnnotationSet, AnnotationsByView, ViewMode } from '../types.js';

/**
 * Commits a new `AnnotationSet` for the active view, returning a frozen
 * pair. This is the single site where the **toggle-preserves-annotations
 * invariant** is enforced: the spread copies the inactive view's
 * reference unchanged, and `freezeInPlace` returns its input reference
 * (re-freezing the already-frozen inactive set is a no-op), so the
 * inactive entry stays `===` to the prior frame.
 */
export default function replaceView(
	annotations: AnnotationsByView,
	view: ViewMode,
	updated: AnnotationSet,
): AnnotationsByView {
	return freezeInPlace<AnnotationsByView>({ ...annotations, [view]: updated });
}
