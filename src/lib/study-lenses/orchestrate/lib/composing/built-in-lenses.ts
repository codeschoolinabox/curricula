/**
 * The built-in lens roster: the append-base every mount-time join extends.
 *
 * @remarks
 * The scaffolding level is never here anyway: it is a level, not a lens, and
 * it reaches a session through injection only, like any host-provided level.
 * Constant-file form (DEV.md § 1): a named const, exported at the bottom.
 */

import debugPropsLens from '../../../lenses/debug-props/index.jsx';
import parsonsLens from '../../../lenses/parsons/index.jsx';
import type { Lens } from '../../../lenses/types.js';
import writemeLens from '../../../lenses/writeme/index.jsx';

const builtInLenses: ReadonlyArray<Lens> = [
	parsonsLens,
	writemeLens,
	debugPropsLens,
];

export default builtInLenses;
