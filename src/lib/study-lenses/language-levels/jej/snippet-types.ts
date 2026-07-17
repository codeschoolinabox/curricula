import freezeInPlace from '@utils/freeze-in-place.js';

import type { SnippetType } from '../types.js';

/**
 * @file The snippet types this level admits — the value that satisfies the spine
 * `LanguageLevel.snippetTypes`. JEJ programs are modules, so they are strict-mode
 * JavaScript natively: no prologue is injected and no line shifts. The level's
 * models describe exactly those strict semantics, so a module is the only snippet
 * type it admits.
 */

const SNIPPET_TYPES = freezeInPlace<readonly SnippetType[]>(['module']);

export default SNIPPET_TYPES;
