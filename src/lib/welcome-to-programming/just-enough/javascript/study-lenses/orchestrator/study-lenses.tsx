/**
 * @file Pre-Increment-0 orchestrator stub. Re-exports the plugin's
 * `StudyLensesMock` as `<StudyLenses>` to keep the build green until
 * the real orchestrator lands.
 *
 * @remarks This is NOT the real orchestrator — it is the minimum
 * viable pass-through. Every real piece (toolbar, pipeline, cache,
 * EventBus, lens registry, inline swap) is scheduled for Phase 1
 * increments. The plugin's `<StudyLenses>` emission arrives here
 * (via the swizzled `MDXComponents` registry) with the flat prop
 * shape declared in
 * `src/lib/welcome-to-programming/just-enough/javascript/study-lenses/types.ts`
 * as `PluginEmittedProps`. The mock renders a minimal placeholder;
 * the real orchestrator will own state + toolbar + pipeline +
 * lens area.
 */

import StudyLensesMock from '@site/src/plugins/study-lenses/components/StudyLensesMock';

const StudyLenses = StudyLensesMock;

export default StudyLenses;
