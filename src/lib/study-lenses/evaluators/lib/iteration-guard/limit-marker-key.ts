/**
 * @file The marker key — the single own property the marked limit throw
 * carries, whose value is the trip record. Both sites import this default
 * to stay in sync — never hardcode the string (the wrap-helper-name
 * precedent): the stamp site (`create-iteration-guard.ts`) defines it on
 * the thrown error; the classification (`read-limit-trip.ts`) reads it.
 * The `__$` prefix rides the same out-of-surface naming as the helpers —
 * accident-proofing, not malice-proofing (README § Design commitments).
 */

export default '__$iterationLimit';
