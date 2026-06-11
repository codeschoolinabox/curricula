import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { DocEntry as DocumentEntry } from '../../orchestrate/lib/editing/types.js';

import assembleDocTable from './assemble-doc-table.js';
import GLOBAL_ENTRIES from './globals.js';
import KEYWORD_ENTRIES from './keywords.js';
import MEMBER_ENTRIES from './members.js';
import NOT_IN_JEJ_ENTRIES from './not-in-jej.js';

const DOC_TABLE: Readonly<Record<string, DocumentEntry>> = deepFreezeInPlace(
	assembleDocTable(
		KEYWORD_ENTRIES,
		GLOBAL_ENTRIES,
		MEMBER_ENTRIES,
		NOT_IN_JEJ_ENTRIES,
	),
);

export default DOC_TABLE;
