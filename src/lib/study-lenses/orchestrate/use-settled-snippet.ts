import React from 'react';

import debounce from '@utils/debounce.js';
import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	SettledSnippet,
	UseSettledSnippetInput,
	UseSettledSnippetResult,
} from './types.js';

/**
 * The settle hook — the region's edit-to-settle mechanics. Edit events
 * arrive per keystroke through `onEdit`; a trailing-edge debounce holds
 * them; its trailing edge writes the settled snippet. A snippet-type change
 * is a settle of its own, never debounced: it absorbs any pending settle and
 * settles immediately with the editor's LIVE source — pending keystrokes are
 * settled early, never discarded. The swap model adds two seams: the
 * live-source read (the buffer survives editor unmounts here, not in the
 * editor) and the immediate flush a lens-open absorbs pending keystrokes
 * with (identity-retained when the buffer already equals the settled pair).
 *
 * @remarks
 * The settled snippet is the staleness identity of everything derived from
 * it; a re-settle replaces it wholesale. The debounce's cancellation runs in
 * the always-returned effect cleanup, so an unmount mid-debounce leaks no
 * timer and lands no late write.
 *
 * @param input - The initial source and the current snippet type.
 * @returns The settled snippet and the per-keystroke edit intake.
 */
export default function useSettledSnippet({
	initialSource,
	type,
}: UseSettledSnippetInput): UseSettledSnippetResult {
	const [settled, setSettled] = React.useState<SettledSnippet>(() =>
		freezeInPlace({ source: initialSource, type }),
	);

	// The editor's current buffer as of the last edit event — what a type
	// toggle settles with (the live source, never a stale or initial one).
	const liveSource = React.useRef(initialSource);

	// The current type, read at debounce-fire time so a settle scheduled
	// before a re-render never carries a stale type (the latest-prop ref
	// pattern the Editor component set the precedent for).
	const typeReference = React.useRef(type);
	typeReference.current = type;

	// One debounced settle per instance, created once — its trailing edge
	// writes the settled pair.
	const [settle] = React.useState(() =>
		debounce(
			(source: string) =>
				setSettled(freezeInPlace({ source, type: typeReference.current })),
			SETTLE_DEBOUNCE_MS,
		),
	);

	const onEdit = React.useCallback(
		function relayEdit(source: string): void {
			liveSource.current = source;
			settle(source);
		},
		[settle],
	);

	// The live buffer, readable across editor unmounts — the swap model's
	// source-survival seam (a lens excursion unmounts the editor; the buffer
	// lives here). Fresh per render, like the result wrapper: never a dep.
	function readLiveSource(): string {
		return liveSource.current;
	}

	// The flush-at-open: absorb any pending settle NOW. The cancel is
	// unconditional — even a retained-identity flush must kill the pending
	// timer, or it fires 200ms later and mints an equal-content NEW pair
	// (breaking the retained-identity contract downstream derivation keys
	// on). Content equality is the retained-identity discriminant (the
	// debounce exposes no pending-query); a retained identity re-derives and
	// re-announces nothing. Fresh per render: never a dep.
	function settleNow(): void {
		settle.cancel();
		setSettled(function reuseOrReplace(previous) {
			// `type` is compared too: the toggle effect keeps settled.type in
			// sync before any caller can reach this branch today, but the
			// field-equality over the WHOLE pair is the documented contract.
			const isCurrent =
				previous.source === liveSource.current &&
				previous.type === typeReference.current;
			return isCurrent
				? previous
				: freezeInPlace({
						source: liveSource.current,
						type: typeReference.current,
					});
		});
	}

	// A type change is a settle of its own: absorb any pending settle and
	// settle NOW with the live source — pending keystrokes are settled
	// early, never discarded. The cleanup is always returned (idle-safe), so
	// an unmount mid-debounce leaks no timer and lands no late write.
	const previousType = React.useRef(type);
	React.useEffect(
		function settleImmediatelyOnTypeToggle() {
			if (previousType.current !== type) {
				previousType.current = type;
				// Redundant with the returned cleanup (which runs first on a
				// dep change) — kept as defense-in-depth; cancel is idempotent.
				settle.cancel();
				setSettled(freezeInPlace({ source: liveSource.current, type }));
			}
			return function cancelAnyPendingSettle(): void {
				settle.cancel();
			};
		},
		[type, settle],
	);

	// The wrapper is fresh-per-render React plumbing, never held past the
	// render that produced it — the DEV § 13 freeze applies to the settled
	// pair (frozen at construction), not this container.
	return { onEdit, readLiveSource, settled, settleNow };
}

/**
 * Idle window (ms) for the trailing-edge settle — an edit reschedules it;
 * derivation runs once the learner pauses this long (the quarry's
 * live-embodiment design point, ~150–300ms).
 */
const SETTLE_DEBOUNCE_MS = 200;
