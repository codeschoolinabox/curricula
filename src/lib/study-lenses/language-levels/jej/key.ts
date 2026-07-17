/**
 * @file The level's registry identity — the key the level registry files this
 * level under, and the value that satisfies the spine `LanguageLevel.key`. The
 * spine reserves the empty key for the none-state, so a shipped level always
 * claims a non-empty, collision-free key of its own.
 */

const KEY = 'jej';

export default KEY;
