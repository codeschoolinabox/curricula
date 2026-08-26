/**
 * The machinery-owned default time budget, in seconds — the number that
 * governs a run whose spec omits `seconds`. The engine owns this value
 * (README § Public API); consumers that echo a resolved budget import it
 * from here rather than declaring a second copy (human ruling 2026-08-25
 * — the evaluators' always-populated `options.seconds` echo is the named
 * consumer). One source of the number: `evaluate.ts` consumes this same
 * export at both of its fallback sites.
 */

const DEFAULT_SECONDS = 5;

export default DEFAULT_SECONDS;
