/**
 * @file `<Toolbar>` — the always-visible affordance container at the top
 * of `<StudyLenses>`. Per the contract in
 * [`./README.md`](./README.md) § The two selection surfaces and
 * [`./DOCS.md`](./DOCS.md) § Toolbar data flow, the toolbar shell is
 * invariant; its contents are mode-aware:
 *
 * - A **lens-picker dropdown** (`<select data-orchestrator-lens-picker>`)
 *   over the registered lenses, always rendered.
 * - A **conditional edit button**
 *   (`<button data-orchestrator-edit-button>`) that appears only when
 *   `state.mode === 'lens'`.
 *
 * L1.1 ships the shell only; subsequent L1 increments add the picker
 * and the edit button.
 */

import React from 'react';

function Toolbar(): React.JSX.Element {
	return <nav data-orchestrator-toolbar />;
}

export default Toolbar;
