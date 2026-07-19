import type { Facts, LifecyclePhaseName, StageCause } from './types.js';

/**
 * One phase's accessibility: reachable, or barred with the upstream cause
 * that barred it. The lens lists join in later — this map is accessibility
 * alone. Kept local: the join infers this shape structurally from the return
 * type — no import needed (the vendored-vocabulary precedent).
 */
type PhaseAccessibility =
	| { readonly accessible: true }
	| { readonly accessible: false; readonly cause: StageCause };

/**
 * Derive each lifecycle phase's accessibility from the tagged fact stages,
 * by fixed rules: `source` and `tokens` are always accessible; `ast` is
 * barred only by a tokens failure; `environment` and `evaluation` are barred
 * by a tokens, ast, or entwining failure. A phase's own-stage error never
 * bars it — it renders inside the phase — and an environment defect never
 * bars evaluation: the scope structure is terminal.
 *
 * @remarks
 * The entwined stage already carries the first upstream failure's cause, so
 * one read covers every upstream origin — the cause a barred phase shows is
 * the one the earliest failing stage wrote. This leans on the derivers'
 * carry chain (`facts` as `deriveFacts` builds them): a hand-assembled Facts
 * that breaks the chain — entwined ok over a failed ast — would under-bar
 * silently; the invariant lives in the derivers, not in this map.
 */
export default function deriveAccessibility(
	facts: Facts,
): Record<LifecyclePhaseName, PhaseAccessibility> {
	return {
		source: { accessible: true },
		tokens: { accessible: true },
		ast: facts.tokens.ok
			? { accessible: true }
			: { accessible: false, cause: facts.tokens.cause },
		environment: facts.entwined.ok
			? { accessible: true }
			: { accessible: false, cause: facts.entwined.cause },
		evaluation: facts.entwined.ok
			? { accessible: true }
			: { accessible: false, cause: facts.entwined.cause },
	};
}
