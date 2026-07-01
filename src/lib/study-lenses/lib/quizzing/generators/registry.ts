/**
 * @file The generator registry — the single list of which forms quizzing serves,
 * each registered by anchor type (DOCS § Decisions "one generator per form,
 * registered by anchor type"). The run phase iterates this list; the registry,
 * not the generator, owns iteration. Generators land here as their increments
 * ship — V1 (category-ID, per-token) and V2 (keyword-vocab, per-token curated),
 * then the per-node forms V6 (kind-semantics, one per binding), V6b (const-update
 * twin, curated, const only), V7 (usage-kind), V8 (declaration-site), the V10a/b/c
 * sameness forms (binding, binding × use-type, and cross-variable use-type), and
 * the program-anchored V4 (two-chains — scope vs prototype resolution — which reads
 * both context anchor streams at once, so it fires last).
 */

import type { Generator } from './types.js';
import v1CategoryId from './v1-category-id.js';
import v10aBindingSameness from './v10a-binding-sameness.js';
import v10bBindingUseType from './v10b-binding-use-type.js';
import v10cCrossVariableUseType from './v10c-cross-variable-use-type.js';
import v2KeywordVocab from './v2-keyword-vocab.js';
import v4TwoChains from './v4-two-chains.js';
import v6KindSemantics from './v6-kind-semantics.js';
import v6bConstUpdate from './v6b-const-update.js';
import v7UsageKind from './v7-usage-kind.js';
import v8DeclarationSite from './v8-declaration-site.js';

const GENERATORS: readonly Generator[] = [
	v1CategoryId,
	v2KeywordVocab,
	v6KindSemantics,
	v6bConstUpdate,
	v7UsageKind,
	v8DeclarationSite,
	v10aBindingSameness,
	v10bBindingUseType,
	v10cCrossVariableUseType,
	v4TwoChains,
];

export default GENERATORS;
