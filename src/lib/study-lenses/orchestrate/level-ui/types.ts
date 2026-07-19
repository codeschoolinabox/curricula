/**
 * The level surfaces' contracts: the option each registered level renders
 * as, and the props of the selector-plus-toggle surface. Everything arrives
 * computed; intent goes up as callbacks.
 *
 * Surface docs: ./README.md (contract) · ./DOCS.md (architecture). The
 * region's `FitMark` (../types.ts) is the mark vocabulary.
 */

import type { FitMark } from '../types.js';

/**
 * One registered level as the selector renders it: the registry key (the
 * data-attribute identity), the display label, the level's current fit
 * mark, and its documentation for hover — the level's reference docs,
 * collapsed to one string upstream. Delivered v1 as plain text via the
 * native `title` attribute; the rendered-markdown hover surface is a
 * flagged follow-on (F6).
 */
export type LevelOption = {
	readonly key: string;
	readonly label: string;
	readonly mark: FitMark;
	readonly docs: string;
};

/**
 * What the selector-plus-toggle surface receives. Options render in exactly
 * the given order; `selectedKey: ''` selects the none-state, whose entry is
 * a label (`noneLabel`) and not a level. Selecting the none-state entry
 * raises `onSelectLevel('')`; `onToggleStrict` carries the REQUESTED next
 * posture (the resulting value, matching the bus's posture-toggled
 * semantics). The caller guarantees `selectedKey` is `''` or a given
 * option's key — this surface performs no defensive check.
 */
export type LevelSelectorProperties = {
	readonly options: ReadonlyArray<LevelOption>;
	readonly selectedKey: string;
	readonly noneLabel: string;
	readonly strict: boolean;
	readonly onSelectLevel: (key: string) => void;
	readonly onToggleStrict: (strict: boolean) => void;
};
