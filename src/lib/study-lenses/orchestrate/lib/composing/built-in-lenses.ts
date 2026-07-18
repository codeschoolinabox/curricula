/**
 * The built-in lens roster: the append-base every mount-time join extends.
 *
 * @remarks
 * Empty today — no lens ships built in yet. The scaffolding level is never
 * here anyway: it is a level, not a lens, and it reaches a session through
 * injection only, like any host-provided level. Constant-file form
 * (DEV.md § 1): a named const, exported at the bottom.
 */

import type { Lens } from '../../../lenses/types.js';

const builtInLenses: ReadonlyArray<Lens> = [];

export default builtInLenses;
