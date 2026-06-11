import type {
	DocEntry as DocumentEntry,
	DocLookupCallback as DocumentLookupCallback,
} from '../../orchestrate/lib/editing/types.js';

import DOC_TABLE from './doc-table.js';

const documentJej: DocumentLookupCallback = function documentJej(
	word: string,
): DocumentEntry | null {
	return Object.hasOwn(DOC_TABLE, word) ? DOC_TABLE[word] : null;
};

export default documentJej;
