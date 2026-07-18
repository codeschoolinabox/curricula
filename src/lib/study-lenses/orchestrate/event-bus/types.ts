// cspell:ignore entrancy

/**
 * The internal event bus's contracts: the event taxonomy and the bus shape.
 * Internal coordination only — nothing here appears on the host surface.
 *
 * Bus docs: ./README.md (contract + taxonomy) · ./DOCS.md (architecture).
 * The region glossary (../README.md) owns the shared vocabulary.
 */

import type { SnippetType } from '../../embody/types.js';

/**
 * The taxonomy: four events announcing committed session choices, and
 * `settled` announcing a completed derivation. `settled` is the settle
 * loop's completion — distinct from an evaluation run's `Settlement`, the
 * evaluators' own word. Configuration tweaks announce nothing: a tweak
 * reaches its lens as fresh props through the cascade.
 */
export type EventPayloadMap = {
	readonly 'level-selected': { readonly key: string };
	readonly 'posture-toggled': { readonly strict: boolean };
	readonly 'type-toggled': { readonly type: SnippetType };
	readonly 'lens-opened': { readonly lens: string | null };
	readonly settled: { readonly source: string; readonly type: SnippetType };
};

export type EventName = keyof EventPayloadMap;

export type EventPayload<Name extends EventName> = EventPayloadMap[Name];

export type EventListener<Name extends EventName> = (
	payload: EventPayload<Name>,
) => void;

/**
 * One bus per mounted instance: synchronous dispatch to a
 * snapshot-at-dispatch listener set in registration order, thrown listeners
 * caught and warned, depth-first re-entrancy. `subscribe` registers by
 * listener identity and returns an idempotent teardown — StrictMode's
 * subscribe → cleanup → subscribe is safe. `clear` drops every listener; a
 * test-isolation affordance.
 */
export type EventBus = {
	readonly dispatch: <Name extends EventName>(
		name: Name,
		payload: EventPayload<Name>,
	) => void;
	readonly subscribe: <Name extends EventName>(
		name: Name,
		listener: EventListener<Name>,
	) => () => void;
	readonly clear: () => void;
};
