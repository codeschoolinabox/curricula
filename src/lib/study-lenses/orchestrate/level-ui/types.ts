// cspell:ignore renderable

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
 * mark, and its documentation as renderable markdown for hover — the
 * level's reference docs, collapsed to one string upstream.
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
 * raises `onSelectLevel('')`.
 */
export type LevelSelectorProperties = {
	readonly options: ReadonlyArray<LevelOption>;
	readonly selectedKey: string;
	readonly noneLabel: string;
	readonly strict: boolean;
	readonly onSelectLevel: (key: string) => void;
	readonly onToggleStrict: (strict: boolean) => void;
};
