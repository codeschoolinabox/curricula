/**
 * @file `<Splitter>` shared types (named exports live in a types file per the
 * repo's `import/no-named-export` convention). The component's own props type
 * stays inline in `./index.tsx`; these two are shared with the pure core
 * (`./geometry.ts`).
 */

/** `row` = side-by-side panes (a vertical handle line, horizontal drag);
 * `column` = stacked panes (a horizontal handle line, vertical drag). */
export type SplitOrientation = 'row' | 'column';

/** Which pane carries the explicit px basis; the other flexes to fill. */
export type SizedPane = 'first' | 'second';

/**
 * How the split responds to a CONTAINER resize (not a divider drag).
 * `fixed` (default) — the sized pane keeps its px basis; the flex pane absorbs
 * the change (the DDD's px-disposable behaviour). `proportional` — the basis
 * rescales with the container so the UI/console (etc.) RATIO is preserved.
 */
export type ResizeMode = 'fixed' | 'proportional';
