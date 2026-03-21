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

	traceCollector.emit({
		type: entryType,
		prefix: formattedPrefix,
		style,
		logs,
		loc,
		nodeType,
	});
	if (group === 'start') {
		traceCollector.emit('>>>');
	}
};

print.groupEnd = () => {
	traceCollector.emit('<<<');
};
