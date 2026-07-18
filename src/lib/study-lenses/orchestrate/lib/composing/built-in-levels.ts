/**
 * The built-in level roster: the append-base every mount-time join extends.
 *
 * @remarks
 * Empty today — no level ships built in yet. The scaffolding level is never
 * among them: it reaches a session through injection only, like any
 * host-provided level (canon: `../../../language-levels/README.md`).
 * Constant-file form (DEV.md § 1): a named const, exported at the bottom.
 */

import type { LanguageLevel } from '../../../language-levels/types.js';

const builtInLevels: ReadonlyArray<LanguageLevel> = [];

export default builtInLevels;
