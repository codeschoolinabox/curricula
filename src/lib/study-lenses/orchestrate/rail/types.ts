/**
 * The rail's contract: what the surface receives, and the one intent it
 * raises.
 *
 * Surface docs: ./README.md (contract) · ./DOCS.md (architecture). The region
 * types (../types.ts) own the station and caption vocabulary; the package
 * glossary (../../README.md) owns the shared meanings.
 */

import type { LifecyclePhaseName } from '../../embody/types.js';
import type { Caption, Station } from '../types.js';

/**
 * The intent one tray entry raises: this station offered this lens and the
 * learner pressed it.
 *
 * @remarks
 * ONE intent, not an open and a close. The open lens's own tray entry is also
 * its close affordance, while a recommendation may target the open lens and
 * re-open it — the same lens with two affordances of opposite meaning. Only
 * the top component knows which lens is open, and it is the single owner of
 * session choices, so the rail raises the press and the owner resolves it.
 * Two callbacks racing over one lens would put that resolution in the surface
 * that cannot see the answer.
 */
export type TrayEntryIntent = {
	readonly phase: LifecyclePhaseName;
	readonly lens: string;
};

/**
 * What the rail receives. Stations render in exactly the given order — the
 * rail never sorts, never inserts, and never knows the canonical five.
 *
 * @remarks
 * `openLensName` is the committed open lens the occupant dot marks. `null`
 * marks no station at all, which is what the pane holding the editor looks
 * like from here — and what the generator looks like too, since a generator
 * names no lens and belongs to no phase.
 */
export type RailProperties = {
	readonly stations: ReadonlyArray<Station>;
	readonly caption: Caption;
	readonly openLensName: string | null;
	readonly onTrayEntry: (intent: TrayEntryIntent) => void;
};
