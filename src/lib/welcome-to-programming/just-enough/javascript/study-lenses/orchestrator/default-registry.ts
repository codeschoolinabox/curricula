/**
 * @file Default module registry for the React orchestrator.
 *
 * Wraps `createRegistry()` and pre-registers every lens/transform module
 * the orchestrator ships with by default. The wrapper component calls
 * this once per mount via `useMemo` (per-instance registry, per DOCS §1).
 *
 * @remarks Increment 8 ships exactly one lens (the editor stub). To add
 * a lens or transform in a later increment, import its default export
 * and add a single `registry.register(...)` line below — the cycle of
 * adding a new module is one import + one line. Removing the editor
 * stub when the real CodeMirror editor lands is a no-op for THIS file
 * because the new editor lives at the same path with the same
 * default-export shape.
 */

import editor from '../lenses/editor/editor.js';
import highlight from '../lenses/highlight/highlight.js';
import createRegistry from '../registry.js';
import type { Registry } from '../types.js';

/**
 * Build a registry pre-populated with the default module set.
 *
 * @returns A mutable `Registry` with every shipped module already
 *   registered. Safe to mutate further (the registry exposes
 *   `register()`); the orchestrator does not mutate it after this call.
 */
function createDefaultRegistry(): Registry {
	const registry = createRegistry();
	registry.register(editor);
	registry.register(highlight);
	return registry;
}

export default createDefaultRegistry;
