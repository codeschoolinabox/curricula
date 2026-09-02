/**
 * The built-in lens roster: the append-base every mount-time join extends.
 *
 * @remarks
 * A default mount is a learner's, so what is here is what a learner meets.
 * The debug lens is NOT among them: it carries no exercise, no scoring and no
 * recommendation, and its own documents call it a development harness rather
 * than a pedagogical surface — so it reaches a session through injection only,
 * exactly as the scaffolding level does. The scaffolding level is never here
 * anyway: it is a level, not a lens.
 * Constant-file form (DEV.md § 1): a named const, exported at the bottom.
 */

import parsonsLens from '../../../lenses/parsons/index.jsx';
import type { Lens } from '../../../lenses/types.js';
import writemeLens from '../../../lenses/writeme/index.jsx';

const builtInLenses: ReadonlyArray<Lens> = [parsonsLens, writemeLens];

export default builtInLenses;
