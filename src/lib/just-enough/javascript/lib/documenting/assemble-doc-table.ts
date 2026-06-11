import type { DocEntry as DocumentEntry } from '../../orchestrate/lib/editing/types.js';

export default function assembleDocTable(
	...partitions: ReadonlyArray<Readonly<Record<string, DocumentEntry>>>
): Record<string, DocumentEntry> {
	// `Object.create(null)` produces a prototype-less object so that
	// `__proto__` can be assigned as an ordinary property name.
	// (A normal `{}` would interpret `result.__proto__ = entry` as
	// setting the prototype rather than creating the property.)
	const result: Record<string, DocumentEntry> = Object.create(null) as Record<
		string,
		DocumentEntry
	>;
	for (const partition of partitions) {
		for (const [word, entry] of Object.entries(partition)) {
			if (Object.hasOwn(result, word)) {
				throw new Error(
					`lib/documenting/doc-table: duplicate key '${word}' across category partitions`,
				);
			}
			result[word] = entry;
		}
	}
	return result;
}
