import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { DocEntry } from '../../orchestrate/lib/editing/types.js';

import KEYWORD_ENTRIES from './keywords.js';
import GLOBAL_ENTRIES from './globals.js';
import MEMBER_ENTRIES from './members.js';
import NOT_IN_JEJ_ENTRIES from './not-in-jej.js';

export function assembleDocTable(
	...partitions: ReadonlyArray<Readonly<Record<string, DocEntry>>>
): Record<string, DocEntry> {
	const result: Record<string, DocEntry> = {};
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

const DOC_TABLE: Readonly<Record<string, DocEntry>> = deepFreezeInPlace(
	assembleDocTable(
		KEYWORD_ENTRIES,
		GLOBAL_ENTRIES,
		MEMBER_ENTRIES,
		NOT_IN_JEJ_ENTRIES,
	),
);

export default DOC_TABLE;
