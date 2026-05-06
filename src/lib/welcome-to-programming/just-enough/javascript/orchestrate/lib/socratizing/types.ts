/**
 * @file Types for the micro-decisions module.
 *
 * @remarks Defines the Socratic code analysis output: each
 * `CodeQuestion` carries questions (not corrections), plus
 * metadata from three pedagogical frameworks (BLOCK model,
 * PBSI, and Rhetorics of Programming).
 *
 * Questions are one of two kinds:
 * - `micro-decision`: about the *choices* made in the code
 * - `comprehension`: about *understanding* what the code does
 *
 * Also defines the internal analyzer function signatures
 * used by the category files in `analyzers/`, and the
 * configuration type consumed by `analyzeMicroDecisions`.
 */

import type { Node } from 'acorn';

import type { SourcePosition, SourceRange } from '../../../embody/lib/validating/types.js';
import type { ScopeAnalysis } from '../../../embody/lib/scope/types.js';

// ─── Re-exports for consumer convenience ────────────────────

export type { SourcePosition, SourceRange } from '../../../embody/lib/validating/types.js';

// ─── BLOCK model (Schulte 2008) ─────────────────────────────

/**
 * The three dimensions of the BLOCK model.
 *
 * @remarks
 * - `text-surface`: the written code — syntax, layout, naming
 * - `execution`: what happens at runtime — data flow, state
 * - `purpose`: why the code exists — intent, design rationale
 */
type BlockDimension = 'text-surface' | 'execution' | 'purpose';

/**
 * The four levels of the BLOCK model.
 *
 * @remarks
 * - `atom`: individual language elements (a single statement,
 *   operator, or identifier)
 * - `block`: a coherent group of statements achieving a sub-task
 * - `relation`: connections between blocks (data/control flow)
 * - `macro`: the overall program
 */
type BlockLevel = 'atom' | 'block' | 'relation' | 'macro';

/**
 * A single cell in the BLOCK model matrix.
 */
type BlockCell = {
	readonly dimension: BlockDimension;
	readonly level: BlockLevel;
};

// ─── PBSI (Purpose, Behavior, Strategy, Implementation) ─────

/**
 * The four levels of the PBSI framework.
 *
 * @remarks Introduced in Chapter 3.4 of the curriculum as the
 * vocabulary for understanding programs at multiple zoom levels.
 *
 * - `purpose`: why a program exists, what it does for whom
 * - `behavior`: user-facing behavior without seeing the code
 * - `strategy`: the approach to solving the problem (the
 *   algorithm in informal terms)
 * - `implementation`: the specific lines of code used
 */
type PBSILevel = 'purpose' | 'behavior' | 'strategy' | 'implementation';

// ─── Rhetorics of Programming ───────────────────────────────

/**
 * The three audiences that source code communicates with.
 *
 * @remarks The curriculum's core framework: source code
 * simultaneously addresses developers (through naming,
 * structure, comments), the computer (through precise
 * instructions), and users (through program behavior).
 */
type Audience = 'developers' | 'computer' | 'users';

// ─── Question kind ──────────────────────────────────────────

/**
 * The kind of a `CodeQuestion`.
 *
 * @remarks
 * - `micro-decision`: about the *choices* made in the code —
 *   "What effect does this choice have?" (supports Modify > Write)
 * - `comprehension`: about *understanding* what the code does —
 *   "What does this line do?" (supports Read > Trace > Describe)
 */
type CodeQuestionKind = 'micro-decision' | 'comprehension';

// ─── Feature ────────────────────────────────────────────────

/**
 * The JeJ language feature the question targets.
 *
 * @remarks Each question is associated with one feature, enabling
 * consumers to show only the features they are currently teaching.
 *
 * - `variables`: let/const declarations, reads, writes, naming
 * - `data`: literals, types, string values
 * - `operators`: arithmetic, comparison, logical, string
 * - `controlFlow`: if/else, while, for-of, ternary
 * - `functions`: method calls (JeJ has calls but no declarations)
 * - `userInteraction`: prompt, confirm, alert, console.log
 * - `reading`: holistic questions — read-aloud, program paths,
 *   audience perspective-taking
 */
type Feature =
	| 'variables'
	| 'data'
	| 'operators'
	| 'controlFlow'
	| 'functions'
	| 'userInteraction'
	| 'reading';

// ─── Level ──────────────────────────────────────────────────

/**
 * The pedagogical level of a question.
 *
 * @remarks Linearized from the BLOCK model's 12-cell matrix into
 * five named levels that match the curriculum's skill progression.
 * A single question can span multiple levels.
 *
 * - `syntax`: "the code" — text surface at the atom level
 * - `semantics`: "how it works" — execution at atom/block level
 * - `connections`: "relations between parts" — data/control flow
 * - `goals`: "purpose and big picture" — macro-level purpose
 * - `userExperience`: "the user's perspective" — behavior audience
 */
type Level =
	| 'syntax'
	| 'semantics'
	| 'connections'
	| 'goals'
	| 'userExperience';

// ─── Question registers ─────────────────────────────────────

/**
 * The register of a Socratic question.
 *
 * @remarks Learning environments use registers to implement
 * the Feedback Ladder (EDM 2024): open questions for beginners
 * (low information, high learning gain), pointed questions as
 * scaffolding, comparative questions for exploring alternatives.
 *
 * - `open`: invites broad reflection
 * - `pointed`: directs attention to a specific aspect
 * - `comparative`: asks the reader to consider an alternative
 */
type QuestionRegister = 'open' | 'pointed' | 'comparative';

/**
 * A single Socratic question within a `CodeQuestion`.
 *
 * @remarks Optional `hints` are tool references — not answers.
 * They point the learner toward a strategy: "the trace might help",
 * "try reading line {n} aloud". Hints are themselves Socratic.
 */
type Question = {
	readonly register: QuestionRegister;
	readonly text: string;
	readonly hints?: readonly string[];
};

// ─── Categories ─────────────────────────────────────────────

/**
 * The category of a `CodeQuestion`.
 *
 * @remarks Forms a spectrum from pure style to almost-
 * certainly-wrong:
 *
 * - `voice`: style choice — finding your voice
 * - `clarity`: affects readability/maintainability
 * - `consistency`: same concept expressed differently
 * - `caution`: often a bug, could be intentional
 * - `trap`: almost certainly a bug
 * - `easter-egg`: undocumented feature the learner discovered
 */
type Category =
	| 'voice'
	| 'clarity'
	| 'consistency'
	| 'caution'
	| 'trap'
	| 'easter-egg';

// ─── Core output type ────────────────────────────────────────

/**
 * A single Socratic question about the source code.
 *
 * @remarks Contains questions (not corrections) tagged with
 * metadata from three pedagogical frameworks. The `id` is a
 * stable kebab-case string that learning environments use to
 * track which questions have been shown, dismissed, or engaged
 * with — enabling adaptive fading per the expertise reversal
 * principle (Kalyuga et al. 2003).
 *
 * The `context` field uses PBSI vocabulary and references
 * rhetorical audiences where natural: "This **implementation**
 * choice affects how **other developers** read the code."
 *
 * All fields are readonly. CodeQuestion objects are frozen.
 */
type CodeQuestion = {
	readonly id: string;
	readonly kind: CodeQuestionKind;
	readonly category: Category;
	readonly feature: Feature;
	readonly levels: readonly Level[];
	readonly location: SourceRange;
	readonly nodeType: string;
	readonly context: string;
	readonly questions: readonly Question[];
	readonly block: readonly BlockCell[];
	readonly pbsi: readonly PBSILevel[];
	readonly audiences: readonly Audience[];
};

// ─── Configuration ───────────────────────────────────────────

/**
 * Configuration for `analyzeMicroDecisions`.
 *
 * @remarks All fields are optional. Omitting a field (or omitting
 * the entire config) means "include everything". To exclude
 * something, set its toggle to `false`. All toggles default `true`.
 *
 * Filtering logic:
 * - A question passes if ALL applicable config groups match
 *   (AND between groups)
 * - Within each group, a question passes if ANY of its tags
 *   match an enabled toggle (OR within groups)
 * - `register` filtering prunes individual entries from a
 *   CodeQuestion's `questions` array; if all are pruned the
 *   CodeQuestion is removed
 * - `range` filters post-generation so analyzers have full
 *   AST/scope context
 * - `count` caps the final list after all other filters
 */
type MicroDecisionConfig = {
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
	 * @remarks Note the mapping: the `Category` type uses `'easter-egg'`
	 * (kebab-case), but the config key is `easterEgg` (camelCase) per
	 * standard JS object key conventions. `filterQuestions` must map
	 * `question.category === 'easter-egg'` to `config.categories.easterEgg`.
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
	 * Source line range to filter by (1-based, inclusive).
	 * Applied post-generation: questions whose `location`
	 * overlaps the range are kept (any overlap, not full
	 * containment).
	 */
	range?: {
		start: number;
		end: number;
	};

	/**
	 * Maximum number of questions to return.
	 * Questions are ordered by source location (top-to-bottom)
	 * before capping.
	 *
	 * @remarks `0` is treated identically to omitting this field
	 * (no limit). Do not rely on `count: 0` as a meaningful signal —
	 * use omission to mean "no limit". Any positive integer caps the
	 * result to that many questions.
	 */
	count?: number;
};

// ─── Result type ─────────────────────────────────────────────

/**
 * A failed analyzer — collected and returned rather than thrown,
 * keeping the main function pure (no `console.warn` side effects).
 */
type AnalyzerError = {
	readonly analyzerId: string;
	readonly message: string;
};

/**
 * The result of `analyzeMicroDecisions`.
 *
 * @remarks Discriminated union:
 * - `ok: true` — parse succeeded; `questions` holds results
 *   (may be empty if no questions match the config).
 *   `analyzerErrors` is present only if one or more analyzers
 *   threw — the function degrades gracefully rather than failing.
 * - `ok: false` — source could not be parsed; `error` describes
 *   why. Valid code with no matching questions returns `ok: true`
 *   with an empty array, not `ok: false`.
 */
type MicroDecisionResult =
	| {
			readonly ok: true;
			readonly questions: readonly CodeQuestion[];
			readonly analyzerErrors?: readonly AnalyzerError[];
	  }
	| {
			readonly ok: false;
			readonly error: {
				readonly message: string;
				readonly location?: SourcePosition;
			};
	  };

// ─── Analyzer signatures (internal) ─────────────────────────

/**
 * A point analyzer inspects individual AST nodes during the walk.
 *
 * @remarks Returns a single question if the node triggers
 * detection, or `null` if it doesn't. Called once per node per
 * analyzer during the AST walk.
 *
 * Use `extractLocation(node, source)` to produce the `SourceRange`
 * for the question's `location` field. Use `node.type` as the value
 * for `nodeType`.
 */
type PointAnalyzer = (
	node: Node,
	scope: ScopeAnalysis,
	source: string,
) => CodeQuestion | null;

/**
 * A program analyzer inspects the entire AST after the walk.
 *
 * @remarks Used for patterns that need the full picture:
 * consistency checks (comparing patterns across the program)
 * and the voice profile (characterizing overall style).
 * Returns zero or more questions.
 *
 * For program-level questions that span the entire source (e.g.,
 * the voice profile), use `'Program'` as the `nodeType` and the
 * location of the root node as the `location` field.
 */
type ProgramAnalyzer = (
	ast: Node,
	scope: ScopeAnalysis,
	source: string,
) => readonly CodeQuestion[];

// ─── Factory input type ────────────────────────────────────

/**
 * Input shape for `createCodeQuestion`. All fields required.
 */
type CodeQuestionInput = {
	readonly id: string;
	readonly kind: CodeQuestionKind;
	readonly category: Category;
	readonly feature: Feature;
	readonly levels: readonly Level[];
	readonly location: SourceRange;
	readonly nodeType: string;
	readonly context: string;
	readonly questions: readonly Question[];
	readonly block: readonly BlockCell[];
	readonly pbsi: readonly PBSILevel[];
	readonly audiences: readonly Audience[];
};

// ─── Parse result type ─────────────────────────────────────

/**
 * Successful parse: the AST is available.
 */
type ParseSuccess = {
	readonly ok: true;
	readonly ast: Node;
};

/**
 * Failed parse: error message and optional location.
 */
type ParseFailure = {
	readonly ok: false;
	readonly error: {
		readonly message: string;
		readonly location?: SourcePosition;
	};
};

/**
 * The result of `parseSource`. Discriminated union on `ok`.
 */
type ParseResult = ParseSuccess | ParseFailure;

// ─── Analyzer entry types ──────────────────────────────────

/**
 * A point analyzer entry in a category's analyzer array.
 */
type AnalyzerEntry = {
	readonly id: string;
	readonly analyze: PointAnalyzer;
};

/**
 * A program analyzer entry in a category's analyzer array.
 */
type ProgramAnalyzerEntry = {
	readonly id: string;
	readonly analyze: ProgramAnalyzer;
};

// ─── Exports ────────────────────────────────────────────────

export type {
	AnalyzerEntry,
	AnalyzerError,
	Audience,
	BlockCell,
	BlockDimension,
	BlockLevel,
	Category,
	CodeQuestion,
	CodeQuestionInput,
	CodeQuestionKind,
	Feature,
	Level,
	MicroDecisionConfig,
	MicroDecisionResult,
	ParseFailure,
	ParseResult,
	ParseSuccess,
	PBSILevel,
	PointAnalyzer,
	ProgramAnalyzer,
	ProgramAnalyzerEntry,
	Question,
	QuestionRegister,
};
