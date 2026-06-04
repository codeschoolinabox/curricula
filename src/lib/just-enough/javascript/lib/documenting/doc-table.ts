import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { DocEntry as DocumentEntry } from '../../orchestrate/lib/editing/types.js';

import GLOBAL_ENTRIES from './globals.js';
import KEYWORD_ENTRIES from './keywords.js';
import MEMBER_ENTRIES from './members.js';
import NOT_IN_JEJ_ENTRIES from './not-in-jej.js';

export function assembleDocTable(
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

const DOC_TABLE: Readonly<Record<string, DocumentEntry>> = deepFreezeInPlace(
	assembleDocTable(
		KEYWORD_ENTRIES,
		GLOBAL_ENTRIES,
		MEMBER_ENTRIES,
		NOT_IN_JEJ_ENTRIES,
	),
);

export default DOC_TABLE;
