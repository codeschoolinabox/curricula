import freezeInPlace from '@utils/freeze-in-place.js';

import type { LifecyclePhaseName } from '../embody/types.js';

/**
 * The five phases' learner-facing display labels, keyed by phase name —
 * zipped against embody's runtime order constant at the point of use, never
 * a positional list, so the phase order keeps exactly one truth.
 * Presentation this region owns; the data names are embody's.
 */
const DISPLAY_LABELS: Readonly<Record<LifecyclePhaseName, string>> =
	freezeInPlace({
		source: 'Source',
		tokens: 'Tokens · spelling',
		ast: 'AST · grammar',
		environment: 'Environment · names',
		evaluation: 'Evaluation · run',
	});

export default DISPLAY_LABELS;
