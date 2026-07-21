/**
 * The JEJ level's spine object — the complete language level, assembled from
 * the level's canonical parts: registry identity, display name, validator,
 * admitted snippet types, learner-facing docs, editor-support channels, and
 * model builders.
 *
 * @remarks
 * Pure carriage: every field is the canonical part imported under its own
 * name — nothing is derived here, and the level's static channels appear on
 * no data path (see ./DOCS.md). The reference and notional-machine prose
 * ship as raw markdown strings, loaded at build time via `?raw`. The spine
 * object is deeply frozen at definition — it is a shared module-level
 * constant.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { LanguageLevel } from '../types.js';

import KEY from './key.js';
import LABEL from './label.js';
import notionalMachine from './notional-machine.md?raw';
import buildRealmModel from './realm-model.js';
import reference from './reference.md?raw';
import SNIPPET_TYPES from './snippet-types.js';
import validate from './validate.js';

const jejLevel: LanguageLevel = freezeInPlace({
	key: KEY,
	label: LABEL,
	validate,
	snippetTypes: SNIPPET_TYPES,
	docs: { reference, notionalMachine },
	// the level ships no completion, format, or hover data — null marks each
	// channel deliberately empty, the shape the scaffold level established
	editorSupport: { completion: null, format: null, hover: null },
	models: { realm: buildRealmModel },
});

export default jejLevel;
