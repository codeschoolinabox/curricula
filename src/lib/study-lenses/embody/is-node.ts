import type { Node } from 'acorn';

/**
 * Whether a value looks like an acorn node: a non-null object carrying a string
 * `type`. The minimal shape every ESTree node shares.
 *
 * @remarks
 * This is the whole membership rule the region's generic walks need, and the
 * reason none of them carries a list of metadata keys to skip. The keys that
 * are never children cannot pass it: `type` is a string, `start` and `end` are
 * numbers, `range` is a pair of numbers, and a source location carries no
 * `type` of its own. Naming them separately would restate what the check
 * already guarantees, and a second list is a second thing to keep in step.
 */
export default function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Record<string, unknown>).type === 'string'
	);
}
