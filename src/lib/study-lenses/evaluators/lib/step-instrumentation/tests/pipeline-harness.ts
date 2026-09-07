/**
 * The suites' one in-file-style harness (node host): resolve → instrument →
 * createCollector → execute the instrumented text with the collector's
 * global injected → answer the run's surfaces. A TEST host — the library
 * never executes; this file is suite infrastructure, not module surface.
 */
import instrument from '../instrument.js';
import resolveOptions from '../resolve-options.js';
import createCollector from '../runtime/create-collector.js';
import type {
	Collector,
	DeclinedSite,
	StepInstrumentationOptions,
	TraceEvent,
} from '../types.js';

type TraceRun = {
	readonly events: readonly TraceEvent[];
	readonly visitCounts: Readonly<Record<string, number>>;
	readonly declines: readonly DeclinedSite[];
	readonly collector: Collector;
	readonly thrown: unknown;
};

export default function traceInNode(
	code: string,
	options: StepInstrumentationOptions = {},
	caps: {
		readonly maxSites?: number | null;
		readonly maxTime?: number | null;
		readonly maxIterations?: number | null;
	} = {},
	sourceType: 'script' | 'module' = 'script',
): TraceRun {
	const resolved = resolveOptions(options);
	const program = instrument({ code, sourceType, options: resolved });
	const collector = createCollector({
		namespace: program.namespace,
		programStamp: program.programStamp,
		data: resolved.data,
		range: resolved.range,
		maxSites: caps.maxSites ?? null,
		maxTime: caps.maxTime ?? null,
		maxIterations: caps.maxIterations ?? null,
	});
	let thrown: unknown;
	try {
		// eslint-disable-next-line @typescript-eslint/no-implied-eval, sonarjs/code-eval -- the TEST host executes the module's own instrumented output over inline corpus strings; the library never executes
		const executor = new Function(program.namespace, program.code);
		// eslint-disable-next-line sonarjs/code-eval -- invoking that same suite-host executor
		executor(collector.global);
	} catch (error) {
		thrown = error;
	}
	return {
		events: collector.events(),
		visitCounts: collector.visitCounts(),
		declines: program.declines,
		collector,
		thrown,
	};
}
