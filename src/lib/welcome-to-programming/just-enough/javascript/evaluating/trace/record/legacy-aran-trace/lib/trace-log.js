import { state } from '../data/state.js';
import { config } from '../data/config.js';
import { deepClone } from './deep-clone.js';
import { traceCollector } from './trace-collector.js';

const linePrefix = (line, col = null) => {
	const stepNumber = state.loggedSteps || 0;
	if (state.loggedSteps !== 0) {
		state.loggedSteps += 1;
	}

	let prefix = '';

	if (config.lines) {
		const lineNumberString = line < 10 ? ' ' + line : '' + line;
		const colNumberString = col < 10 ? col + ' ' : '' + col;
		prefix =
			`line ${lineNumberString}:${
				typeof col === 'number' ? colNumberString : ''
			} -` + prefix;
	}

	if (config.steps) {
		const stepNumberString =
			stepNumber < 10 ? ' ' + stepNumber : '' + stepNumber;
		prefix = `${stepNumberString}. ` + prefix;
	}

	return prefix;
};

const processLogs = (logs) =>
	logs
		.map((thing) =>
			thing &&
			thing.__proto__ &&
			typeof thing.__proto__.name === 'string' &&
			thing.__proto__.name.includes('Error')
				? thing.name
				: thing,
		)
		.map((thing) =>
			typeof thing === 'function'
				? 'a function named "' + thing.name + '"'
				: deepClone(thing),
		);

// WHY: postMessage uses structured clone, which throws on functions,
// symbols, and other non-cloneable values. Entries from the Aran tracer
// can contain native functions (e.g. console.debug). This wrapper
// catches DataCloneError and sanitizes via JSON replacer.
const safePostEntry = (entry) => {
	try {
		postMessage({ type: 'entry', entry });
	} catch (_) {
		const safe = JSON.parse(
			JSON.stringify(entry, (_key, value) => {
				if (typeof value === 'function')
					return '[function ' + (value.name || 'anonymous') + ']';
				if (typeof value === 'symbol') return value.toString();
				return value;
			}),
		);
		postMessage({ type: 'entry', entry: safe });
	}
};

export const print = ({
	logs = [],
	prefix,
	style = '',
	overrideBuiltIn,
	group,
	loc = null,
	nodeType = null,
}) => {
	if (state.builtInEntryPoint && !overrideBuiltIn) {
		return;
	}

	logs = processLogs(logs);

	const tabbing = config.blockScope
		? [].fill('  ', 0, state.blockScopeDepth).join('  ')
		: '';

	if (tabbing) {
		logs.unshift(tabbing);
	}

	const entryType = group === 'start' ? 'groupStart' : 'log';

	let formattedPrefix = null;
	if (typeof prefix === 'number') {
		formattedPrefix = linePrefix(prefix);
	} else if (Array.isArray(prefix)) {
		formattedPrefix = linePrefix(...prefix);
	} else if (typeof prefix === 'string') {
		formattedPrefix = prefix;
	} else if (typeof prefix === 'function') {
		formattedPrefix = prefix(linePrefix);
	}

	const entry = {
		type: entryType,
		prefix: formattedPrefix,
		style,
		logs,
		loc,
		nodeType,
	};

	traceCollector.emit(entry);

	// Stream entry to main thread when running in a Web Worker.
	// WHY WorkerGlobalScope: works in both classic AND module workers.
	// importScripts only exists in classic workers, not module workers.
	// self.postMessage also exists on the main thread (window.postMessage).
	if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
		safePostEntry(entry);
	}

	if (group === 'start') {
		traceCollector.emit('>>>');
		if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
			safePostEntry('>>>');
		}
	}
};

print.groupEnd = () => {
	traceCollector.emit('<<<');
	if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
		safePostEntry('<<<');
	}
};
