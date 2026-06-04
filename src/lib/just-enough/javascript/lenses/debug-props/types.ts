/**
 * @file Domain model for the `debug-props` meta-lens. The lens echoes
 * its received `LensProps` as on-screen panels for sandbox-harness
 * verification of the orchestrator's resolution chain.
 *
 * Two layers (per the lenses peer's two-layer module convention):
 * - The pure-TS core (`./core.ts`) takes `LensProps` and returns a
 *   `DisplayTree` — a frozen, serialisable record naming the panels
 *   to render and their string content.
 * - The React wrapper (`./index.tsx`) maps each `Panel` in the tree
 *   to a `<section data-debug-panel="<key>">` element under a
 *   `<div data-lens="debug-props">` root.
 *
 * @remarks The lens does NOT mutate `embodiment` (deep-frozen per the
 * `embody/` contract) or `config`. `DisplayTree` is built fresh on
 * every render; React owns the mount lifecycle.
 *
 * @remarks `LensConfig` (from `../types.ts`) is the wrapper's prop
 * type for `config`; this lens has no per-key narrowing of the open
 * `LensConfig` shape — arbitrary keys passed in are echoed back as
 * panels, which is exactly the meta-lens's verification job.
 */

// ─── Display derivation result ──────────────────────────────

/**
 * One rendered panel — a labeled section displaying derived content
 * from the incoming `LensProps`. The wrapper renders `<section
 * data-debug-panel="<key>"><h3>{label}</h3><pre>{content}</pre></section>`
 * for each panel, in declaration order.
 *
 * @remarks `key` round-trips into the `data-debug-panel` attribute
 * value — sandbox-harness selectors use it to locate a specific panel.
 * `label` is the user-visible heading text. `content` is the
 * pre-rendered string body (typically `JSON.stringify(value, null, 2)`
 * for objects; the raw string for primitive fields).
 */
type Panel = Readonly<{
	readonly key: string;
	readonly label: string;
	readonly content: string;
}>;

/**
 * The display tree produced by the pure-TS core from `LensProps`.
 * Frozen; read-only. The wrapper iterates `panels` in order and
 * renders one `<section>` per entry.
 *
 * @remarks Field count grows as the lens surfaces more of the
 * embodiment's status / validation / endReport details. The contract
 * is the array shape, not the panel set — adding panels is a
 * non-breaking change.
 */
type DisplayTree = Readonly<{
	readonly panels: ReadonlyArray<Panel>;
}>;

// ─── Exports ────────────────────────────────────────────────

export type { DisplayTree, Panel };
