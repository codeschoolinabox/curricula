let entries = [];

export const traceCollector = {
	reset() {
		entries = [];
	},
	getEntries() {
		return entries;
	},
	emit(entry) {
		entries.push(entry);
	},
};
