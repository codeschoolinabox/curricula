/**
 * The editing surface's internal contracts: the callback boundary the
 * factory wraps CodeMirror behind, and the instance it resolves to. No
 * CodeMirror type ever crosses this file.
 *
 * Surface docs: ./README.md (contract) · ./DOCS.md (architecture). The
 * region glossary (../README.md) owns the shared vocabulary.
 */

/**
 * What the editor calls back with. `onEdit` fires once per document change —
 * per keystroke, carrying the full source. The settle debounce is the top
 * component's, never the editor's; an own-write (a programmatic
 * `setContent`) never echoes an edit.
 */
export type EditorCallbacks = {
	readonly onEdit: (source: string) => void;
};

/**
 * What the async editor factory resolves to.
 *
 * @remarks
 * After `destroy()` the instance is a dead sentinel: `getContent` returns
 * the empty string, `setContent` and repeated `destroy` calls are no-ops,
 * and no callback ever fires again.
 */
export type EditorInstance = {
	readonly getContent: () => string;
	readonly setContent: (source: string) => void;
	readonly destroy: () => void;
};
