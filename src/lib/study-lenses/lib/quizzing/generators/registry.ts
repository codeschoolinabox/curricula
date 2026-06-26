/**
 * @file The generator registry — the single list of which forms quizzing serves,
 * each registered by anchor type (DOCS § Decisions "one generator per form,
 * registered by anchor type"). The run phase iterates this list; the registry,
 * not the generator, owns iteration. Generators land here as their increments
 * ship — V1 (category-ID) first.
 */

import type { Generator } from './types.js';
import v1CategoryId from './v1-category-id.js';
import v7UsageKind from './v7-usage-kind.js';
import v8DeclarationSite from './v8-declaration-site.js';

const GENERATORS: readonly Generator[] = [
	v1CategoryId,
	v7UsageKind,
	v8DeclarationSite,
];

export default GENERATORS;
