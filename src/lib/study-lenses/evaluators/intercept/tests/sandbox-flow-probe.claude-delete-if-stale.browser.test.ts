// Orchestrator diagnostic probe for the I8 🔍 FAIL — UNTRACKED, delete
// when stale. Mimics the sandbox page's exact flow-2 consumption.
import { describe, expect, it } from 'vitest';

import deriveFacts from '../../../embody/derive-facts.js';
import intercept from '../index.js';

function specFor(source: string) {
	return {
		facts: deriveFacts({ source, type: 'script' as const }),
		execution: 'function' as const,
		io: {},
	};
}

describe('page flow probe', () => {
	it('an unmocked prompt delivers the pending-interaction event to a for-await consumer', async () => {
		const answered = intercept.main(
			specFor("const name = prompt('who?');\nconsole.log(name);\n"),
		);
		if ('refused' in answered) {
			throw new Error(`refused: ${String(answered.reason)}`);
		}
		const seen: string[] = [];
		for await (const event of answered) {
			seen.push(event.event);
			if (event.event === 'pending-interaction') {
				event.respond('Ada');
			}
		}
		const result = await answered.result;
		expect([seen, result.outcome]).toEqual([
			['pending-interaction', 'prompt', 'console'],
			'complete',
		]);
	});

	it('the page dump serializer survives the pending event but the raw result is cyclic', async () => {
		const answered = intercept.main(specFor("const name = prompt('who?');\n"));
		if ('refused' in answered) {
			throw new Error(`refused: ${String(answered.reason)}`);
		}
		let pendingDumpFailed = false;
		for await (const event of answered) {
			if (event.event === 'pending-interaction') {
				try {
					JSON.stringify(event, (_k, v) =>
						typeof v === 'function' ? '[fn]' : v,
					);
				} catch {
					pendingDumpFailed = true;
				}
				event.respond(null);
			}
		}
		const result = await answered.result;
		let resultDumpFailed = false;
		try {
			JSON.stringify(result, (_k, v) => (typeof v === 'function' ? '[fn]' : v));
		} catch {
			resultDumpFailed = true;
		}
		expect([pendingDumpFailed, resultDumpFailed]).toEqual([false, true]);
	});
});
