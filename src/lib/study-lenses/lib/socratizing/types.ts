/**
 * @file Canonical types for the socratizing module.
 *
 * The domain model in TypeScript: the Socratic code-analysis output. Each
 * `CodeQuestion` carries questions (not corrections) plus metadata from three
 * pedagogical frameworks — the BLOCK model, PBSI, and the Rhetorics of
 * Programming — anchored to an offset range in the source.
 *
 * Questions are one of two kinds:
 * - `micro-decision`: about the *choices* made in the code
 * - `comprehension`: about *understanding* what the code does
 *
 * Also defines the internal analyzer function signatures the category files in
 * `analyzers/` implement, and the configuration `analyzeMicroDecisions` consumes.
 * See `./README.md` for the catalog, the registers, and the framework tags.
 */

import type * as acorn from 'acorn';

import type { ScopeUsage } from '../scoping/types.js';

/**
 * The three dimensions of the BLOCK model (Schulte 2008).
 *
 * - `text-surface`: the written code — syntax, layout, naming
 * - `execution`: what happens at runtime — data flow, state
 * - `purpose`: why the code exists — intent, design rationale
 */
export type BlockDimension = 'text-surface' | 'execution' | 'purpose';

/**
 * The four levels of the BLOCK model.
 *
 * - `atom`: individual language elements (a single statement, operator, or
 *   identifier)
 * - `block`: a coherent group of statements achieving a sub-task
 * - `relation`: connections between blocks (data / control flow)
 * - `macro`: the overall program
 */
export type BlockLevel = 'atom' | 'block' | 'relation' | 'macro';

/** A single cell in the BLOCK model matrix. */
export type BlockCell = {
	readonly dimension: BlockDimension;
	readonly level: BlockLevel;
};

/**
 * The four levels of the PBSI framework — the curriculum's vocabulary for
 * understanding programs at multiple zoom levels (Chapter 3.4).
 *
 * - `purpose`: why a program exists, what it does for whom
 * - `behavior`: user-facing behavior without seeing the code
 * - `strategy`: the approach to solving the problem (the algorithm in informal
 *   terms)
 * - `implementation`: the specific lines of code used
 */
export type PBSILevel = 'purpose' | 'behavior' | 'strategy' | 'implementation';

/**
 * The three audiences source code communicates with (Rhetorics of Programming):
 * `developers` (through naming, structure, comments), the `computer` (through
 * precise instructions), and `users` (through program behavior).
 */
export type Audience = 'developers' | 'computer' | 'users';

/**
 * The kind of a `CodeQuestion`.
 *
 * - `micro-decision`: about the *choices* made in the code — "What effect does
 *   this choice have?" (supports Modify → Write)
 * - `comprehension`: about *understanding* what the code does — "What does this
 *   line do?" (supports Read → Trace → Describe)
 */
export type CodeQuestionKind = 'micro-decision' | 'comprehension';

/**
 * The JeJ language feature a question targets. Each question names one feature,
 * so a consumer can show only the features it is currently teaching.
 *
 * - `variables`: let/const declarations, reads, writes, naming
 * - `data`: literals, types, string values
 * - `operators`: arithmetic, comparison, logical, string
 * - `controlFlow`: if/else, while, do-while, for, for-of, for-in, ternary
 * - `functions`: method calls (JeJ has calls but no declarations)
 * - `userInteraction`: prompt, confirm, alert, console.log
 * - `reading`: holistic questions — read-aloud, program paths, audience
 *   perspective-taking
 */
export type Feature =
	| 'variables'
	| 'data'
	| 'operators'
	| 'controlFlow'
	| 'functions'
	| 'userInteraction'
	| 'reading';

/**
 * The pedagogical level of a question, linearized from the BLOCK model's 12-cell
 * matrix into five named levels matching the curriculum's skill progression. A
 * single question can span multiple levels.
 *
 * - `syntax`: "the code" — text surface at the atom level
 * - `semantics`: "how it works" — execution at atom/block level
 * - `connections`: "relations between parts" — data / control flow
 * - `goals`: "purpose and big picture" — macro-level purpose
 * - `userExperience`: "the user's perspective" — behavior audience
 */
export type Level =
	| 'syntax'
	| 'semantics'
	| 'connections'
	| 'goals'
	| 'userExperience';

/**
 * The register of a Socratic question — how a learning environment implements
 * the Feedback Ladder (EDM 2024): open questions for beginners (low information,
 * high learning gain), pointed as scaffolding, comparative for exploring
 * alternatives.
 *
 * - `open`: invites broad reflection
 * - `pointed`: directs attention to a specific aspect
 * - `comparative`: asks the reader to consider an alternative
 */
export type QuestionRegister = 'open' | 'pointed' | 'comparative';

/**
 * A single Socratic question within a `CodeQuestion`.
 *
 * Optional `hints` are tool references — not answers. They point the learner
 * toward a strategy ("the trace might help", "try reading line {n} aloud"). Hints
 * are themselves Socratic.
 */
export type Question = {
	readonly register: QuestionRegister;
	readonly text: string;
	readonly hints?: readonly string[];
};

/**
 * The category of a `CodeQuestion` — a spectrum from pure style to
 * almost-certainly-wrong.
 *
 * - `voice`: style choice — finding your voice
 * - `clarity`: affects readability / maintainability
 * - `consistency`: same concept expressed differently
 * - `caution`: often a bug, could be intentional
 * - `trap`: almost certainly a bug
 * - `easter-egg`: undocumented feature the learner discovered
 */
export type Category =
	| 'voice'
	| 'clarity'
	| 'consistency'
	| 'caution'
	| 'trap'
	| 'easter-egg';

/**
 * A single Socratic question about the source code.
 *
 * Contains questions (not corrections) tagged with metadata from three
 * pedagogical frameworks. `id` is a stable kebab-case string a learning
 * environment uses to track which questions have been shown, dismissed, or
 * engaged with — enabling adaptive fading per the expertise-reversal principle
 * (Kalyuga et al. 2003). `location` is a zero-indexed half-open `[start, end)`
 * offset range into the source (from `node.start`/`node.end`); it inlines its
 * shape rather than name a range type. `context` uses PBSI vocabulary and
 * references rhetorical audiences where natural; where it does, the term is
 * usually bolded in place — the `let-vs-const` context ends "This **implementation**
 * choice affects how **other developers** read the code." That bolding is an
 * analyzer-authoring habit, not a constraint this type enforces: nothing
 * validates the markup, many contexts carry no bold at all, and a bolded word
 * need not be a `PBSILevel` or `Audience` member verbatim (`**user**` appears
 * where the member is `users`). All fields are readonly; `CodeQuestion`
 * objects are frozen.
 */
export type CodeQuestion = {
	readonly id: string;
	readonly kind: CodeQuestionKind;
	readonly category: Category;
	readonly feature: Feature;
	readonly levels: readonly Level[];
	readonly location: { readonly start: number; readonly end: number };
	readonly nodeType: string;
	readonly context: string;
	readonly questions: readonly Question[];
	readonly block: readonly BlockCell[];
	readonly pbsi: readonly PBSILevel[];
	readonly audiences: readonly Audience[];
};

/**
 * Configuration for `analyzeMicroDecisions`.
 *
 * All fields are optional. Omitting a field (or the whole config) means "include
 * everything"; every toggle defaults `true`, so a caller lists only what to
 * remove. Filtering logic:
 * - a question passes if ALL applicable config groups match (AND between groups);
 * - within each group, it passes if ANY of its tags match an enabled toggle (OR
 *   within groups);
 * - `register` filtering prunes individual entries from a `CodeQuestion`'s
 *   `questions` array; if all are pruned the `CodeQuestion` is removed;
 * - `range` filters post-generation so analyzers keep full AST / scope context;
 * - `count` caps the final list after all other filters.
 */
export type MicroDecisionConfig = {
	/** Which kinds of questions to include. */
	kind?: {
		microDecision?: boolean;
		comprehension?: boolean;
	};

	/** Which JeJ language features to include. */
	features?: {
		variables?: boolean;
		data?: boolean;
		operators?: boolean;
		controlFlow?: boolean;
		functions?: boolean;
		userInteraction?: boolean;
		reading?: boolean;
	};

	/** Which pedagogical levels to include. */
	levels?: {
		syntax?: boolean;
		semantics?: boolean;
		connections?: boolean;
		goals?: boolean;
		userExperience?: boolean;
	};

	/** Which rhetorical audiences to include. */
	audiences?: {
		developers?: boolean;
		computer?: boolean;
		users?: boolean;
	};

	/** Which question registers to include. */
	register?: {
		open?: boolean;
		pointed?: boolean;
		comparative?: boolean;
	};

	/**
	 * Which categories to include.
	 *
	 * Note the mapping: the `Category` type uses `'easter-egg'` (kebab-case) but
	 * the config key is `easterEgg` (camelCase, per JS object-key convention).
	 * `filterQuestions` maps `question.category === 'easter-egg'` to
	 * `config.categories.easterEgg`.
	 */
	categories?: {
		voice?: boolean;
		clarity?: boolean;
		consistency?: boolean;
		caution?: boolean;
		trap?: boolean;
		easterEgg?: boolean;
	};

	/**
	 * Source offset range to filter by: a zero-indexed half-open `[start, end)`
	 * character span. Applied post-generation — a question is kept if its
	 * `location` overlaps the range at all (any overlap, not full containment).
	 * (Offsets, not line numbers: the anchoring is offset-native.)
	 */
	range?: {
		start: number;
		end: number;
	};

	/**
	 * Maximum number of questions to return. Questions are ordered by source
	 * location (top-to-bottom) before capping.
	 *
	 * `0` is treated identically to omitting this field (no limit) — use omission
	 * to mean "no limit"; any positive integer caps the result to that many.
	 */
	count?: number;
};

/**
 * A failed analyzer — collected and returned rather than thrown, keeping the
 * main function pure (no `console.warn` side effects).
 */
export type AnalyzerError = {
	readonly analyzerId: string;
	readonly message: string;
};

/**
 * The result of `analyzeMicroDecisions`. Discriminated union:
 * - `ok: true` — analysis ran; `questions` holds results (may be empty if none
 *   match the config). `analyzerErrors` is present only if one or more analyzers
 *   threw — the function degrades gracefully rather than failing.
 * - `ok: false` — a required fact stage did not succeed (an unparseable program,
 *   or a guarded environment defect); `error` describes why, with the parser's
 *   source `offset` when it reports one. Valid code with no matching questions
 *   returns `ok: true` with an empty array, not `ok: false`.
 */
export type MicroDecisionResult =
	| {
			readonly ok: true;
			readonly questions: readonly CodeQuestion[];
			readonly analyzerErrors?: readonly AnalyzerError[];
	  }
	| {
			readonly ok: false;
			readonly error: {
				readonly message: string;
				readonly offset?: number;
			};
	  };

/**
 * A point analyzer inspects individual AST nodes during the walk. Returns a
 * single question if the node triggers detection, or `null` if it doesn't;
 * called once per node per analyzer.
 *
 * Use `extractLocation(node)` to produce the offset `location`, and `node.type`
 * for `nodeType`.
 */
export type PointAnalyzer = (
	node: acorn.Node,
	scope: ScopeUsage,
	source: string,
) => CodeQuestion | null;

/**
 * A program analyzer inspects the entire AST after the walk. Used for patterns
 * that need the full picture: consistency checks (comparing patterns across the
 * program) and the voice profile (characterizing overall style). Returns zero or
 * more questions.
 *
 * For program-level questions that span the whole source (e.g. the voice
 * profile), use `'Program'` as the `nodeType` and the root node's offsets as
 * `location`.
 */
export type ProgramAnalyzer = (
	ast: acorn.Node,
	scope: ScopeUsage,
	source: string,
) => readonly CodeQuestion[];

/** Input shape for `createCodeQuestion`. All fields required. */
export type CodeQuestionInput = {
	readonly id: string;
	readonly kind: CodeQuestionKind;
	readonly category: Category;
	readonly feature: Feature;
	readonly levels: readonly Level[];
	readonly location: { readonly start: number; readonly end: number };
	readonly nodeType: string;
	readonly context: string;
	readonly questions: readonly Question[];
	readonly block: readonly BlockCell[];
	readonly pbsi: readonly PBSILevel[];
	readonly audiences: readonly Audience[];
};

/** A point analyzer entry in a category's analyzer array. */
export type AnalyzerEntry = {
	readonly id: string;
	readonly analyze: PointAnalyzer;
};

/** A program analyzer entry in a category's analyzer array. */
export type ProgramAnalyzerEntry = {
	readonly id: string;
	readonly analyze: ProgramAnalyzer;
};
