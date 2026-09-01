import freezeInPlace from '@utils/freeze-in-place.js';

import type { FailableStageName, LifecyclePhaseName } from '../embody/types.js';

import type {
	EmptyCount,
	FitMark,
	PaneOccupant,
	UnreachedCount,
} from './types.js';

/**
 * Every learner-facing string this region keys or derives. One home, one
 * discipline: each family is keyed or derived against a vocabulary, never
 * authored at the render site — a surface that renders a string imports it,
 * it does not spell it.
 *
 * @remarks
 * Each keyed family is TOTAL over its key type, which is what makes "zipped
 * against the vocabulary, never a positional list" a compile error rather
 * than a discipline. Two families bind a key to a shared string on purpose:
 * `environment` shares the machinery framing (it can originate a cause but
 * never a rendered one, so the branch is reachable only through `entwined`),
 * and the lens and generator arms share the nameplate's occupant form.
 *
 * Families that FRAME foreign content author the frame alone — the parser's
 * message, the phase label, and the occupant's own name are composed in by
 * the surface, never rewritten here.
 */
type DisplayLabels = {
	readonly phaseLabels: Readonly<Record<LifecyclePhaseName, string>>;
	readonly phaseShortLabels: Readonly<Record<LifecyclePhaseName, string>>;
	readonly noneStateLevel: string;
	readonly fitMarks: Readonly<Record<FitMark, string>>;
	readonly nameplateForms: Readonly<Record<PaneOccupant['mode'], string>>;
	readonly nameplatePhaseTail: string;
	readonly standingWaiting: string;
	readonly trayHeading: string;
	readonly proposalsHeading: string;
	readonly emptyStationReasons: Readonly<Record<LifecyclePhaseName, string>>;
	readonly emptyCountLines: Readonly<Record<EmptyCount, string>>;
	readonly unreachedCountLines: Readonly<Record<UnreachedCount, string>>;
	readonly causeFramings: Readonly<Record<FailableStageName, string>>;
	readonly blockedWaysOut: string;
};

const DISPLAY_LABELS: DisplayLabels = freezeInPlace({
	/**
	 * The five phases' full labels, zipped against embody's runtime order
	 * constant at the point of use — never a positional list, so the phase
	 * order keeps exactly one truth.
	 */
	phaseLabels: {
		source: 'Source',
		tokens: 'Tokens · spelling',
		ast: 'AST · grammar',
		environment: 'Environment · names',
		evaluation: 'Evaluation · run',
	},

	/**
	 * The short labels the rail draws where width demands it. AUTHORED, not
	 * the full label truncated at its separator: truncation is not a
	 * vocabulary choice, and `Source` carries no separator to truncate at.
	 */
	phaseShortLabels: {
		source: 'Source',
		tokens: 'Tokens',
		ast: 'AST',
		environment: 'Environment',
		evaluation: 'Evaluation',
	},

	/** The none-state's display string — what the selector's closed face reads. */
	noneStateLevel: 'plain JavaScript',

	/**
	 * The four marks' learner-facing copy, keyed by the mark it renders. A
	 * mark is machine vocabulary: a learner reads that their code steps
	 * outside a level, never that it is `does-not-fit`.
	 */
	fitMarks: {
		fits: 'fits',
		'does-not-fit': 'steps outside',
		'not-applicable-for-type': 'modules only',
		undetermined: "can't tell yet",
	},

	/**
	 * The nameplate's two forms, chosen by the ARM of the pane occupant and
	 * never by the posture — so the rule is total and a posture change never
	 * rewrites the line. The occupant's own name is composed in.
	 */
	nameplateForms: {
		editor: 'your code',
		lens: 'the pane holds:',
		generator: 'the pane holds:',
	},

	/**
	 * The nameplate's conditional phase tail, framing the phase label. A
	 * panel-excluded lens declares no phase, and there the occupant's own
	 * name is the whole line.
	 */
	nameplatePhaseTail: 'a way to study',

	/**
	 * The `waiting` standing's drawn word. Only one of the three standings
	 * has a string — `openable` draws its disclosure control and its count,
	 * `bare` a single mid-line dot — which is why the standing is not keyed
	 * like a fit mark. The machine value stays `waiting`; this is the
	 * learner's word for it.
	 */
	standingWaiting: 'not reached',

	/** The tray's own heading, framing the phase's FULL label. */
	trayHeading: 'ways to study the',

	/** The proposals' heading. One string, invariant. */
	proposalsHeading: 'next, you could:',

	/**
	 * An empty station's own reason, carried as visually-hidden text because
	 * the caption names no station. The SPOKEN form is not the printed one:
	 * the label's `·` becomes a comma, since a spoken label may be longer and
	 * plainer than a printed one.
	 */
	emptyStationReasons: {
		source: 'Source: nothing studies this phase yet',
		tokens: 'Tokens, spelling: nothing studies this phase yet',
		ast: 'AST, grammar: nothing studies this phase yet',
		environment: 'Environment, names: nothing studies this phase yet',
		evaluation: 'Evaluation, run: nothing studies this phase yet',
	},

	/**
	 * The caption's count line, keyed by the derived count. Singular at one;
	 * zero does not render, so it is not a key. This counts what is
	 * accessible and EMPTY — a different number over a different predicate
	 * from the unreached count, and the two are never both on screen.
	 */
	emptyCountLines: {
		1: 'one phase has nothing to open yet',
		2: 'two phases have nothing to open yet',
		3: 'three phases have nothing to open yet',
		4: 'four phases have nothing to open yet',
		5: 'five phases have nothing to open yet',
	},

	/**
	 * The cause arm's second row, counting what WAITS. A suffix of exactly
	 * two or three waits, so the plural is total and there is no singular
	 * key to author.
	 */
	unreachedCountLines: {
		2: 'the last two phases were not reached',
		3: 'the last three phases were not reached',
	},

	/**
	 * The cause line's framing, keyed by the STAGE that failed rather than by
	 * the phase that is barred — an `ast` failure and an `entwined` failure
	 * bar exactly the same phases, so the key is not derivable from the
	 * geometry. The machine's own message is composed in and never rewritten.
	 *
	 * Three authored strings over four keys: `environment` shares the
	 * machinery framing because it can never originate a RENDERED cause —
	 * nothing it bars is drawn. Keeping it total makes the lookup a field
	 * read with no dead branch, and if it were ever read it says the true
	 * thing.
	 */
	causeFramings: {
		tokens: 'the spelling broke here',
		ast: 'the grammar broke here',
		entwined: 'the machinery broke here, not your code',
		environment: 'the machinery broke here, not your code',
	},

	/**
	 * The blocked sentence's three ways out, and THE ORDER IS CONTRACT: fix
	 * the code, then pick another level, then turn strict off. A sentence
	 * offering strict-off first would teach escape, which is the one thing
	 * this ordering exists to prevent. The level's label and its cause are
	 * composed in ahead of it.
	 *
	 * One sentence, not a record keyed by `MaskCause['kind']`: the contract
	 * states one ordered sentence, and the type-admission arm's own ways out
	 * are drawn nowhere in the twin and owned by no decision row. Authoring
	 * a second string here would invent copy nobody ruled.
	 */
	blockedWaysOut: 'Fix the code, pick another level, or turn strict off.',
});

export default DISPLAY_LABELS;
