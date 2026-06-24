import type {
	FeatureName,
	FeatureSubset,
	RepairContext,
	SizeBounds,
} from './types.js';

/**
 * Builds the single natural-language prompt handed to the local model's
 * `generate(prompt)` — the pure, sync "Prompt construction" phase.
 *
 * @remarks
 * Takes the already-resolved, decomposed pieces of a request (the input
 * `program`, the learner `prompt`, the feature `subset`, the size `size`) — never
 * an `AithorConfig`, and never `validate` or `model`: the prompt is built the
 * same way regardless of `validate`, so its independence from `validate` is
 * structural (it is not a parameter). Resolution (`AithorConfig` →
 * `ResolvedAithorConfig`) lives upstream in the orchestrator, mirroring the
 * sibling `RunOptions` → `ResolvedRunOptions` pattern.
 *
 * The output is ratified instructional prose (one user-message string — the
 * runtime sends no system prompt): a teacher-persona line, the learner ask
 * verbatim (omitted when empty), a fenced seed block (omitted when `program` is
 * empty — composing from scratch is the base case of varying a seed), a
 * Requirements list stringified from the subset and bounds, and an output
 * instruction asking for one ` ```js ` block. The seed is fenced with a bare
 * ` ``` ` so ` ```js ` is unique to that output instruction for any admitted JEJ
 * seed (JEJ has no triple-backtick syntax); a non-JEJ seed that itself contains
 * ` ```js ` is the downstream extractor's concern, not this pure leaf's.
 *
 * The constraints only ever SHAPE the ask here; whether they are ENFORCED is the
 * curated loop's concern, not this phase's. An empty `include` permits all of
 * JEJ (so the prompt never enumerates the full set); a non-empty `include` is an
 * allow-list, narrowed by `exclude` (which wins on overlap).
 *
 * An optional `repair` makes this the repair turn — the SAME pure phase, now
 * seeded: the whole base ask is re-stated (`generate` is stateless, with no
 * conversation history) and the prior refused candidate plus its located reasons
 * are folded in AFTER the constraints, before the output instruction.
 */
export default function buildPrompt(
	program: string,
	prompt: string,
	subset: FeatureSubset,
	size: SizeBounds,
	repair?: RepairContext,
): string {
	const sections = [
		PERSONA,
		prompt,
		renderSeed(program),
		renderRequirements(subset, size),
		renderRepair(repair),
		OUTPUT_INSTRUCTION,
	];

	return sections.filter((section) => section.length > 0).join('\n\n');
}

const PERSONA =
	'You are writing a short JavaScript program for a student to read and trace by hand.';

const OUTPUT_INSTRUCTION =
	'Reply with only the program, in one ```js code block.';

/** A bare code fence — the seed wears it so ` ```js ` stays unique to OUTPUT. */
const CODE_FENCE = '```';

/**
 * The ratified `FeatureName` → learner-facing phrasing map (the C2 contract). The
 * phrasing names the actual tokens so a weak local model can act on them; the
 * insertion order is the canonical render order. `break`/`continue` carry a
 * `(keyword)` tag so the rendered phrase never collides with ordinary prose.
 */
const FEATURE_PHRASING: ReadonlyMap<FeatureName, string> = new Map([
	['if', 'if-statements'],
	['while', 'while-loops'],
	['do-while', 'do...while loops'],
	['for', 'for-loops'],
	['for-of', 'for...of loops'],
	['break', 'break (keyword)'],
	['continue', 'continue (keyword)'],
	['ternary', 'the ternary ? :'],
	['short-circuit', '&& / || / ?? (short-circuit)'],
	['optional-chaining', 'optional chaining ?.'],
	['typeof', 'typeof'],
	['in', 'the in operator'],
	['increment', '++ / -- (increment/decrement)'],
	['bitwise', 'bitwise operators (& | ^ ~ << >> >>>)'],
	['compound-assignment', 'compound assignment (+= -= ...)'],
	['template-literal', 'template literals (`...`)'],
	['regex', 'regular expressions (/.../)'],
	['bigint', 'BigInt (1n)'],
	['new-date', 'new Date()'],
]);

/** The fenced "vary this" block — empty when composing from scratch. */
function renderSeed(program: string): string {
	if (program.length === 0) return '';

	return `Here is a program to use as a starting point — write a new one in the same spirit:\n\n${CODE_FENCE}\n${program}\n${CODE_FENCE}`;
}

/**
 * The repair block — empty on the initial turn. Shows the refused candidate
 * (fenced, so it corrects its own work) then the located reasons as a fix-list,
 * one bullet per `conform`-supplied `message` in document order. The candidate is
 * admitted JEJ (no triple-backtick syntax), so its bare fence never collides with
 * the output instruction's ` ```js `.
 */
function renderRepair(repair: RepairContext | undefined): string {
	if (repair === undefined) return '';

	const problems = repair.violations
		.map((violation) => `- ${violation.message}`)
		.join('\n');

	return `Your previous attempt did not meet the requirements:\n\n${CODE_FENCE}\n${repair.candidate}\n${CODE_FENCE}\n\nFix these problems, then return a corrected program:\n${problems}`;
}

/**
 * The Requirements list — the feature clause then the size clauses, one bullet
 * each. Empty (no list at all) when the request is unconstrained, so an
 * unconstrained ask never carries a dangling header.
 */
function renderRequirements(subset: FeatureSubset, size: SizeBounds): string {
	const clauses = [
		renderFeatureClause(subset),
		renderLinesClause(size),
		renderComplexityClause(size),
	].filter((clause) => clause.length > 0);

	if (clauses.length === 0) return '';

	return ['Requirements:', ...clauses.map((clause) => `- ${clause}`)].join(
		'\n',
	);
}

/**
 * The feature-subset clause, per the include/exclude policy: a non-empty
 * `include` is an allow-list (narrowed by `exclude`); an empty `include` with a
 * non-empty `exclude` is a forbidden-list; an empty/empty request adds no clause;
 * an allow-list emptied by `exclude` falls back to a simple-only instruction.
 */
function renderFeatureClause(subset: FeatureSubset): string {
	const excluded = new Set<FeatureName>(subset.exclude);

	if (subset.include.length > 0) {
		const permitted = subset.include.filter(
			(feature) => !excluded.has(feature),
		);
		if (permitted.length === 0) {
			return 'Use only simple statements and expressions — no loops, conditionals, or special operators.';
		}
		return `Use only these features: ${renderList(permitted)}.`;
	}

	if (subset.exclude.length > 0) {
		return `Use ordinary JavaScript, but do not use: ${renderList(subset.exclude)}.`;
	}

	return '';
}

function renderLinesClause(size: SizeBounds): string {
	return size.lines === undefined
		? ''
		: `Keep it to at most ${size.lines} lines.`;
}

function renderComplexityClause(size: SizeBounds): string {
	return size.complexity === undefined
		? ''
		: `Do not nest loops or ifs more than ${size.complexity} deep.`;
}

/** Renders a set of features to their phrasing, in canonical map order. */
function renderList(features: readonly FeatureName[]): string {
	const wanted = new Set<FeatureName>(features);

	return [...FEATURE_PHRASING]
		.filter(([feature]) => wanted.has(feature))
		.map(([, phrasing]) => phrasing)
		.join(', ');
}
