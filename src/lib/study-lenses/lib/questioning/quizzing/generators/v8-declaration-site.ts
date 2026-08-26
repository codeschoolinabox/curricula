/**
 * @file The V8 declaration-site generator — the text-surface × relation question
 * "click where `x` is declared", one per reference occurrence of a declared
 * binding. A `node`-anchored generator: it resolves each identifier anchor to its
 * binding through the context's scope forest, fires on **reference** occurrences
 * only (skipping the declaration site itself and unresolved globals), and emits a
 * `click-token` code-surface item whose `targetRanges` is the declaration span.
 * The propagation group is the binding identity (`binding:<start>-<end>`), so a
 * later sameness form (V10a) can bulk-credit every reference to one binding.
 *
 * As a consumer of `resolveBinding`, it feeds the resolver only the descent's
 * anchors,
 * which already exclude non-reference occurrences (a property name `o.x`), so a
 * property name can never mis-resolve into a spurious declaration-site item.
 */

import type { GenerationContext, IdentifierAnchor } from '../context/types.js';
import bindingGroupKey from '../keying/binding-group-key.js';
import resolveBinding from '../resolving/resolve-binding.js';
import type { Binding } from '../resolving/types.js';
import type { CodeSurfaceQuizItem, QuizItem } from '../types.js';

import type { Generator } from './types.js';

const v8DeclarationSite: Generator = {
	anchorType: 'node',
	build(
		anchor: IdentifierAnchor,
		context: GenerationContext,
	): readonly QuizItem[] {
		const binding = resolveBinding(
			{ start: anchor.range[0], text: anchor.name },
			context.forest,
		);
		if (binding === null || sameRange(anchor.range, binding.declarationRange)) {
			return [];
		}
		return [buildV8Item(anchor, binding)];
	},
};

export default v8DeclarationSite;

/**
 * The V8 item for one reference occurrence: a `click-token` question anchored to
 * the reference, targeting the binding's declaration span. The propagation group
 * is the binding identity (via `bindingGroupKey`), so every reference to one
 * binding shares a group. `family` is the form's fixed `'variables'` constant.
 */
function buildV8Item(
	anchor: IdentifierAnchor,
	binding: Binding,
): CodeSurfaceQuizItem {
	return {
		mode: 'click-token',
		id: `V8@${anchor.range[0]}-${anchor.range[1]}`,
		family: 'variables',
		form: 'V8',
		anchorRange: anchor.range,
		cells: [{ dimension: 'text-surface', level: 'relation' }],
		prompt: `Click where \`${binding.name}\` is declared.`,
		targetRanges: [binding.declarationRange],
		groupKey: bindingGroupKey(binding),
		feedback: V8_FEEDBACK,
	};
}

/** Whether two half-open ranges are the same span. */
function sameRange(
	a: readonly [number, number],
	b: readonly [number, number],
): boolean {
	return a[0] === b[0] && a[1] === b[1];
}

const V8_FEEDBACK =
	'This is the declaration — the binding every reference resolves back to under lexical scoping.';
