// cspell:ignore unrepresentable

/**
 * The orchestrator's contract: the package's public host surface, plus the
 * region-internal shared vocabulary — the fit marks the level surfaces
 * share, and the settle/derivation shapes the top component threads.
 * Everything else in this region is internal.
 *
 * Region docs: ./README.md (host surface + mechanics) · ./DOCS.md
 * (architecture). The package glossary (../README.md) owns the shared
 * vocabulary.
 */

import type {
	Embodiment,
	LifecyclePhaseName,
	SnippetType,
	StageCause,
} from '../embody/types.js';
import type { LanguageLevel } from '../language-levels/types.js';
import type { Lens, LensConfig } from '../lenses/types.js';

// A deliberate TYPE-ONLY cycle: marking/types.ts imports FitMark from this
// file. Erased at emit, accepted by tsc strict — safe exactly as long as
// both edges stay `import type`; never add a runtime import either way.
import type { EventPayloadMap } from './event-bus/types.js';
import type { ConfigOverridesByLens } from './lib/composing/types.js';
import type { AssessmentsByLevel } from './lib/marking/types.js';
import type { RankedRecommendations } from './lib/recommending/types.js';
import type { VerdictsByLevel } from './lib/validating/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// The host surface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What the embedding site provides to the one component it mounts. Only
 * `snippet` is required, and every initial choice is a default, never a
 * lock: the learner can override level, posture, snippet type, lens choice,
 * and configuration for their session.
 */
export type StudyLensesProperties = {
	/**
	 * The program source. This prop is the source text alone — the
	 * package glossary's snippet is this prop together with `type`.
	 * Mount-time only: the instrument seeds from it once, and a later
	 * change is ignored — the region's own edit intake is the only writer
	 * thereafter.
	 */
	readonly snippet: string;
	/**
	 * The initial snippet type; the learner's toggle overrides it. Defaults
	 * to `'module'`, resolved once at the top component — every consumer
	 * downstream receives a concrete type, never an absent one.
	 */
	readonly type?: SnippetType;
	/**
	 * An initial-focus request naming a lens — honored, never obeyed: a
	 * phase-declaring lens when its phase is accessible, a panel-excluded
	 * lens after its applicability runs at mount; otherwise normal
	 * rendering. Never a bypass — the enforcement mask applies to a
	 * focus-mounted lens identically. Naming the run lens is the run-first
	 * posture for curated examples.
	 */
	readonly lens?: string;
	/**
	 * The configuration cascade's top layer: overrides keyed by lens name.
	 * Whatever the embedding site composes upstream arrives already folded
	 * in here; the learner's session tweaks stay the final layer.
	 */
	readonly configs?: Readonly<Record<string, Partial<LensConfig>>>;
	/** Injected lenses — append-only; a lens-name collision fails loudly. */
	readonly lenses?: ReadonlyArray<Lens>;
	/**
	 * Injected language levels — append-only; a key collision fails loudly,
	 * and the empty key stays reserved for the none-state.
	 */
	readonly languageLevels?: ReadonlyArray<LanguageLevel>;
	/** The initially selected level's key; `''` selects the none-state. */
	readonly activeLanguageLevel?: string;
	/** The initial enforcement posture; warn — `false` — is the default. */
	readonly strictLanguageLevels?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// The selector's fit marks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The four-valued mark vocabulary a level's assessment carries — derived
 * once per settle and per level in this region's marking library, from the
 * level's verdict, its admitted snippet types, and the current type (the
 * verdict itself encodes the parse status). Region-internal shared
 * vocabulary — the selector renders every level's mark and the mask
 * projects the selected assessment; it is not part of the host surface.
 *
 * @remarks
 * While the code does not parse the mark is `undetermined`, and that
 * verdict wins regardless of type admission — a typo never reads as a level
 * violation, and the parse phases' supports stay available.
 */
export type FitMark =
	| 'fits'
	| 'does-not-fit'
	| 'not-applicable-for-type'
	| 'undetermined';

// ─────────────────────────────────────────────────────────────────────────────
// The settle loop's shapes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The settled snippet: the source and type one derivation ran over — the
 * staleness identity of everything derived from it. Edit events fire per
 * keystroke; a settle is the debounce's trailing edge (or a type toggle's
 * immediate re-derive). Matches the bus's `settled` payload shape.
 */
export type SettledSnippet = {
	readonly source: string;
	readonly type: SnippetType;
};

// Compile-time pin: the bus's `settled` payload is exactly the settled
// snippet — a divergence in either direction fails `npm run typecheck` (the
// test runner does not type-check; this line is the enforcement).
type Expect<T extends true> = T;
export type _SettledPayloadIsExactlySettledSnippet = Expect<
	[EventPayloadMap['settled']] extends [SettledSnippet]
		? [SettledSnippet] extends [EventPayloadMap['settled']]
			? true
			: false
		: false
>;

/**
 * What the settle hook consumes: the initial source (the `snippet` prop) and
 * the current snippet type (a session choice — its change is an immediate
 * settle of its own).
 */
export type UseSettledSnippetInput = {
	readonly initialSource: string;
	readonly type: SnippetType;
};

/**
 * What the settle hook yields: the settled snippet every derivation keys on,
 * the per-keystroke edit intake the editor's edit events feed, and the swap
 * model's two seams — the live-source read (the buffer survives editor
 * unmounts in the hook, not the editor) and the immediate flush an opening
 * excursion absorbs pending keystrokes with.
 */
export type UseSettledSnippetResult = {
	readonly settled: SettledSnippet;
	readonly onEdit: (source: string) => void;
	/**
	 * The live buffer as of the last edit event — survives editor unmounts.
	 * Fresh function identity per render: never an effect or memo dep.
	 */
	readonly readLiveSource: () => string;
	/**
	 * Absorb any pending settle NOW. Retains the settled identity when the
	 * live buffer field-equals the settled pair (no re-derivation, no
	 * re-announce — the round-trip guarantee); else settles the live source
	 * immediately. Fresh function identity per render: never an effect or
	 * memo dep.
	 */
	readonly settleNow: () => void;
};

/**
 * What one derive pass produces for one settled snippet: the frozen
 * embodiment, every registered level's verdict, every level's assessment,
 * and the fitting lenses' recommendations, ranked. Region-internal — the top
 * component holds one and the rendered surfaces project from it.
 *
 * @remarks
 * Derivation-anchored name, deliberately not "study state": the package's
 * study layer is `embodiment.study` (embody's per-phase payloads), and this
 * bundle CONTAINS an embodiment — naming it after the derive pass keeps the
 * two apart. The region glossary pins the distinction.
 */
export type StudyDerivation = {
	readonly embodiment: Embodiment;
	readonly verdicts: VerdictsByLevel;
	readonly assessments: AssessmentsByLevel;
	readonly recommendations: RankedRecommendations;
};

// ─────────────────────────────────────────────────────────────────────────────
// The surface pane's occupant
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What occupies the surface pane — the editor home base XOR one excursion,
 * never two. The editor arm carries its remount seed (captured at dispose —
 * the mount fallback seeds from the snippet prop — and value-stable for that
 * mount; the buffer itself lives in the settle hook's live-source slot). The
 * lens arm carries everything a mount needs frozen for its lifetime: the open
 * lens's name, the settled pair it opened over (the coherence anchor the
 * render invariants compare against), and the opened layer's overrides (those
 * a recommendation-opened mount carries). The generator arm carries only the
 * settled pair it opened over — one field doing the same two jobs as the lens
 * arm's: the seed the view remixes, and the coherence anchor.
 *
 * @remarks
 * Deliberately not named "Surface" — that word belongs to the mask's surface
 * classes. Folding the open-lens name, the open-time snapshot, and the
 * opened overrides into one union makes "a lens without its snapshot" and
 * "overrides outliving the open choice" unrepresentable. The region glossary
 * pins the pane-occupant term; ./DOCS.md § The render projection pins the
 * two-DOM-slot rule the one visual pane abstracts over.
 *
 * `openedAt` carries the same name on both excursion arms deliberately: it is
 * the same fact, and the pane's coherence assert reads it through
 * `Extract<PaneOccupant, { mode: 'lens' | 'generator' }>` — which only
 * type-checks while the field name is shared.
 */
export type PaneOccupant =
	| {
			readonly mode: 'editor';
			readonly editorSeed: string;
	  }
	| {
			readonly mode: 'lens';
			readonly openLensName: string;
			readonly openedAt: SettledSnippet;
			readonly opened: ConfigOverridesByLens;
	  }
	| {
			readonly mode: 'generator';
			readonly openedAt: SettledSnippet;
	  };

// ─────────────────────────────────────────────────────────────────────────────
// The rail's projection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A station's three-valued indicator: `openable` (reachable, and something
 * fits it) · `bare` (reachable, nothing fits — the ordinary case at four of
 * five phases) · `waiting` (barred, downstream of the barring edge). A
 * projection of reachability and kit, in which no level is involved at all —
 * which is why it is deliberately not called a mark.
 *
 * @remarks
 * The machine value and the learner's word are decoupled (human ruling
 * 2026-08-19): the `waiting` standing draws as `not reached`, while
 * `openable` and `bare` draw glyphs and no word at all. Only one of the three
 * has a string, which is why the standing is not keyed like a `FitMark`. The
 * drawn copy lives in `display-labels.ts`, so renaming this union cannot
 * rewrite learner copy and rewording that copy cannot touch this union.
 *
 * `waiting` was reconsidered at 0.3 and KEPT. The README's objection is to its
 * GLOSS — "barred, downstream of the barring edge" reaches for the opposite
 * word — and the gloss is what changed. Renaming the member to `barred` would
 * name the station's standing after the PHASE's property, collapsing the one
 * distinction this vocabulary is most insistent on.
 */
export type Standing = 'openable' | 'bare' | 'waiting';

/**
 * One entry in a station's tray: the lens the intent names, and the copy the
 * learner reads.
 *
 * @remarks
 * The label is CARRIED rather than keyed, and the two are not in tension.
 * A string whose author is outside this region travels on the projection; a
 * string this region keys against a vocabulary it owns is looked up at render
 * from `display-labels.ts`. A lens authors its own name for itself
 * (`Lens.label`), so it travels.
 */
export type TrayEntry = {
	readonly lens: string;
	readonly label: string;
};

/**
 * The rail's per-phase element — one per phase, in the machine's fixed order,
 * carrying the phase (the key everything zips against, never drawn), the
 * standing, and the tray where it has one. Never the phase itself: the phase
 * is data, the station is what renders it.
 *
 * @remarks
 * Three arms rather than one record with an optional tray, because the flat
 * shape admits three states the contract forbids: a bare station carrying a
 * tray (a station with nothing to open has no tray and no disclosure control,
 * not a disabled one), an openable station with nothing in it, and a barred
 * station offering lenses. The tray is a non-empty tuple for the same reason
 * — `openable` means something fits, so `▾ 0` is unrepresentable, and the
 * drawn kit count is the tray's length rather than a second field that could
 * disagree with it.
 *
 * THREE THINGS THE RAIL DRAWS ARE DELIBERATELY NOT FIELDS, and all three rest
 * on one rule: nothing derivable from what the projection already carries
 * gets a field of its own (human ruling 2026-08-19, generalized at 0.3).
 * The occupant dot is derived at render from `PaneOccupant`. The barring edge
 * bars a suffix and never a scatter, so its position is a function of the
 * standing sequence. And the phase's LABEL and SHORT LABEL are a total
 * function of `phase` through `display-labels.ts`, which the rail must import
 * anyway for every other string it draws — carrying them would duplicate a
 * lookup the surface already performs, and would couple this derivation's
 * tests to copy while its sibling's stay copy-free.
 */
export type Station =
	| {
			readonly phase: LifecyclePhaseName;
			readonly standing: 'openable';
			readonly tray: readonly [TrayEntry, ...ReadonlyArray<TrayEntry>];
	  }
	| {
			readonly phase: LifecyclePhaseName;
			readonly standing: 'bare';
	  }
	| {
			readonly phase: LifecyclePhaseName;
			readonly standing: 'waiting';
	  };

// Compile-time pin: the standing vocabulary is exactly the arms' discriminant.
// A new arm, or a member added to `Standing` alone, fails `npm run typecheck`.
export type _StationStandingIsExactlyStanding = Expect<
	[Station['standing']] extends [Standing]
		? [Standing] extends [Station['standing']]
			? true
			: false
		: false
>;

/**
 * The count line's domain. Rule 3 sends zero to the `nothing` arm and rule 4
 * sends every barred rail to the `cause` arm, so this arm exists only while
 * all five phases are accessible.
 *
 * @remarks
 * A literal union rather than `number`, so the count line's keyed copy is
 * total over exactly the values that can render. A count is DERIVED by
 * counting stations, and `Array.prototype.filter().length` is `number`, which
 * does not narrow — so the deriver narrows it explicitly and THROWS on a
 * value outside this domain. That throw is not a defensive branch: it is
 * unreachable by contract, and reaching it means the station list and the
 * caption disagree, which is a loud defect of the same class as an attached
 * lens the roster cannot recover.
 */
export type EmptyCount = 1 | 2 | 3 | 4 | 5;

/**
 * The unreached count's domain: a suffix of exactly two or three phases
 * waits. A `tokens` failure bars three, an `ast` or `entwined` failure bars
 * two, and `environment` bars nothing at all — so the plural is total and
 * there is no singular copy to author.
 *
 * @remarks
 * This narrows on a DERIVATION invariant rather than a structural one. It is
 * true of every embodiment the derivers produce, because `environment` and
 * `evaluation` are barred by the same upstream stage and so bar and unbar
 * together; a hand-assembled set of facts that broke the derivers' carry
 * chain would under-bar, and that invariant lives in the derivers rather than
 * in this type. The deriver's narrowing throw is what keeps the gap honest.
 */
export type UnreachedCount = 2 | 3;

/**
 * The one thing beneath the rail: one slot, two producers, and a total order
 * between them — the cause wherever a barring edge is drawn, else the count,
 * else nothing. The render path resolves that precedence before it has
 * anything to draw.
 *
 * @remarks
 * The union is over the two arms' SHAPES, not over two strings (human ruling
 * 2026-08-19). The count arm is one part; the cause arm is two — the cause
 * whose stage keys the framing, and beneath it the unreached count. A
 * `string | string` union is satisfiable by an implementation that
 * concatenates the cause into one row, which is the defect this distinction
 * exists to make unrepresentable: the cause arm exposes no string field at
 * all, and a count cannot hold prose.
 *
 * BOTH COUNTS ARE REDUNDANT AGAINST THE STATIONS, and carrying them is a
 * CHOICE rather than something the ruling forces. R-AH fixes the cause arm as
 * two-part; it does not rule that the second part is a stored number, and a
 * caption carrying only its cause would satisfy it equally. They are carried
 * so that counting lives in a pure deriver rather than in the component —
 * this region's standing "thin components" constraint — and so that the
 * precedence and the counts are testable without a DOM. The trade against the
 * no-field-for-what-is-derivable rule is deliberate and is recorded here
 * because the rule is otherwise general.
 *
 * The two counts are different numbers over different predicates and are
 * never both on screen — `empty` counts what is accessible and unserved,
 * `unreached` counts what waits. Neither ever stands in for the other.
 *
 * The discriminants name the two PRODUCERS rather than the geometry, so the
 * unswept `cause line` / `cause arm` prose collision reaches no identifier
 * here and a later prose sweep costs no code.
 */
export type Caption =
	| {
			readonly holds: 'cause';
			readonly cause: StageCause;
			readonly unreached: UnreachedCount;
	  }
	| {
			readonly holds: 'count';
			readonly empty: EmptyCount;
	  }
	| { readonly holds: 'nothing' };
