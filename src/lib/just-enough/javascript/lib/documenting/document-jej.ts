import type {
	DocEntry,
	DocLookupCallback,
} from '../../orchestrate/lib/editing/types.js';

import DOC_TABLE from './doc-table.js';

const documentJej: DocLookupCallback = function documentJej(
	word: string,
): DocEntry | null {
	return Object.hasOwn(DOC_TABLE, word) ? DOC_TABLE[word] : null;
};

export default documentJej;
