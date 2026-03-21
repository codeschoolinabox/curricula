import { trace as _trace } from './trace.js';
import { traceCollector } from './lib/trace-collector.js';
import { state } from './data/state.js';

const trace = (program) => {
	state.originalConsole = console;
	traceCollector.reset();

	_trace(program);

	return traceCollector.getEntries();
};

export { trace };

export default trace;
