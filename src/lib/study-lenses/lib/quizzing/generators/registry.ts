/**
 * @file The generator registry — the single list of which forms quizzing serves,
 * each registered by anchor type (DOCS § Decisions "one generator per form,
 * registered by anchor type"). The run phase iterates this list; the registry,
 * not the generator, owns iteration. Generators land here as their increments
 * ship — V1 (category-ID, per-token), then the per-node forms V7 (usage-kind),
 * V8 (declaration-site), V10a (binding sameness), and V10b (binding × use-type
 * sameness).
 */

import type { Generator } from './types.js';
import v1CategoryId from './v1-category-id.js';
import v10aBindingSameness from './v10a-binding-sameness.js';
import v10bBindingUseType from './v10b-binding-use-type.js';
import v7UsageKind from './v7-usage-kind.js';
import v8DeclarationSite from './v8-declaration-site.js';

const GENERATORS: readonly Generator[] = [
	v1CategoryId,
	v7UsageKind,
	v8DeclarationSite,
	v10aBindingSameness,
	v10bBindingUseType,
];

export default GENERATORS;
