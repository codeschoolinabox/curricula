/**
 * The built-in level roster: the append-base every mount-time join extends.
 *
 * @remarks
 * Carries the JEJ level. The scaffolding level is never among them: it reaches
 * a session through injection only, like any host-provided level (canon:
 * `../../../language-levels/README.md`). Membership here decides which levels
 * a session starts with, never what a level may do once consulted.
 * Constant-file form (DEV.md § 1): a named const, exported at the bottom.
 */

import jejLevel from '../../../language-levels/jej/index.js';
import type { LanguageLevel } from '../../../language-levels/types.js';

const builtInLevels: ReadonlyArray<LanguageLevel> = [jejLevel];

export default builtInLevels;
