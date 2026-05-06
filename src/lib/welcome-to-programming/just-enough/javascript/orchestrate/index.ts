/**
 * @file Public surface for the orchestrate peer.
 *
 * `<StudyLenses>` is the sole exported runtime value. `StudyLensesProps`
 * is the sole exported type — it is the caller's interface.
 *
 * Everything else (`OrchestratorState`, `EventBus`, etc.) is
 * orchestrator-internal and deliberately NOT re-exported here.
 *
 * @remarks Phase A: `StudyLensesProps` uses the locked four-prop API
 * (`snippet`, `lens?`, `config?`, `configs?`). WS3 F1 wires the
 * actual React implementation behind this surface.
 */

export { default as StudyLenses } from './orchestrator/study-lenses.js';
export type { StudyLensesProps } from './types.js';
