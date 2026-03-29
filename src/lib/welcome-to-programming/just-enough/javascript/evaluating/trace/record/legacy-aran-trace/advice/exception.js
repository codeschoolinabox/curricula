import { config } from '../data/config.js';
import { state } from '../data/state.js';
import { print } from '../lib/trace-log.js';

export default {
	failure: (value, serial) => {
		// still figuring out aran errors

		print({ prefix: '-> execution phase:', style: 'font-weight: bold;' });

		if (value.message.includes('loopGuard')) {
			print({
				prefix: (value ? value.name : 'failure') + ': too much iteration',
				style: 'color:red;',
				logs: [' run or debug code for a complete error message'],
			});
		} else {
			print({
				prefix: value ? value.name : 'failure',
				style: 'color:red;',
				logs: [' run or debug code for a complete error message'],
			});
		}

		return value;
	},
};
