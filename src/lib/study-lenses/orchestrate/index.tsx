// cspell:ignore renderable Renderable

/**
 * StudyLenses — the one component the host mounts, and the region's
 * composition root: the mount-time joins (loud), the session choices'
 * single owner, the per-instance bus and memoized validate, the settle
 * loop, one study derivation per settle, and the render projection over
 * the surface pane (the editor home base XOR the open lens), the study
 * panel, the level UI, the type toggle, the ranked recommendations, and
 * the guide.
 *
 * @remarks
 * Selector contract: `data-study-lenses` on the root;
 * `data-type-toggle` on the snippet-type toggle (its text is the CURRENT
 * type; clicking commits the other one); `data-edit-return` on the
 * lens-mode-only Edit code button (class 2 — the guaranteed way home);
 * the mounted surfaces carry their own documented attributes. Session choices commit here and announce on
 * the bus; surfaces raise intent upward and hold none.
 */

import React from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import LIFECYCLE_PHASE_ORDER from '../embody/lifecycle-phase-order.js';
import type {
	Embodiment,
	LifecyclePhase,
	LifecyclePhaseName,
} from '../embody/types.js';
import type { Lens, Recommendation } from '../lenses/types.js';

import deriveStudy from './derive-study.js';
import DISPLAY_LABELS from './display-labels.js';
import Editor from './editor/index.jsx';
import createEventBus from './event-bus/create-event-bus.js';
import Guide from './guide/index.jsx';
import LevelSelector from './level-ui/index.jsx';
import joinLensRoster from './lib/composing/join-lens-roster.js';
import joinLevelRoster from './lib/composing/join-level-roster.js';
import recoverRenderableLenses from './lib/composing/recover-renderable-lenses.js';
import resolveLensConfig from './lib/composing/resolve-lens-config.js';
import type {
	ConfigOverridesByLens,
	JoinedLensRoster,
} from './lib/composing/types.js';
import honorFocusRequest from './lib/honoring/honor-focus-request.js';
import isOpenLensReachable from './lib/honoring/is-open-lens-reachable.js';
import deriveMask from './lib/masking/derive-mask.js';
import type { MaskState } from './lib/masking/types.js';
import createMemoizedValidate from './lib/validating/create-memoized-validate.js';
import PhasesPanel from './phases-panel/index.jsx';
import type { PhaseEntry } from './phases-panel/types.js';
import type {
	PaneOccupant,
	SettledSnippet,
	StudyLensesProperties,
} from './types.js';
import useSettledSnippet from './use-settled-snippet.js';

export default function StudyLenses({
	snippet,
	type: initialType = 'module',
	lens,
	configs = {},
	lenses: injectedLenses = [],
	languageLevels: injectedLevels = [],
	activeLanguageLevel = '',
	strictLanguageLevels = false,
}: StudyLensesProperties): React.JSX.Element {
	// 1. Compose at mount — joins loud at the author's desk; one bus and one
	// memoized validate per instance, held for the component's lifetime.
	// The snippet is mount-time-only on the host surface: capturing it here
	// keeps the editor seed and the settle loop on ONE source even if the
	// prop later changes (the settle hook already ignores such a change).
	const [session] = React.useState(() =>
		freezeInPlace({
			bus: createEventBus(),
			lenses: joinLensRoster(injectedLenses),
			levels: joinLevelRoster(injectedLevels),
			snippet,
			validate: createMemoizedValidate(),
		}),
	);

	// 2. Session choices — this component is their single owner; surfaces
	// raise intent, the commits below change state AND announce on the bus.
	const [selectedLevelKey, setSelectedLevelKey] =
		React.useState(activeLanguageLevel);
	const [strict, setStrict] = React.useState(strictLanguageLevels);
	const [type, setType] = React.useState(initialType);

	// 3. The settle loop and the one derivation per settle.
	const { settled, onEdit, readLiveSource, settleNow } = useSettledSnippet({
		initialSource: session.snippet,
		type,
	});
	const derivation = React.useMemo(
		() =>
			deriveStudy(settled, session.levels, session.lenses, session.validate),
		[session, settled],
	);

	// 4. The pane occupant — the honor resolution maps its decision straight
	// onto the surface arm, once, at mount (the lazy initializer): fallback
	// → the editor home base, honored → the lens arm over the initial
	// settled pair. An honored mount is initial state, never a committed
	// session choice — nothing announces (the initializer stays
	// side-effect-free), and the learner overrides it through the same
	// commit paths as any open. StrictMode double-invokes this initializer
	// in dev, so a THROWING applicability reports twice there — dev-only,
	// accepted.
	const [occupant, setOccupant] = React.useState<PaneOccupant>(
		function resolveHonoredFocus(): PaneOccupant {
			const decision = honorFocusRequest({
				embodiment: derivation.embodiment,
				roster: session.lenses,
				...(lens === undefined ? {} : { request: lens }),
			});
			return decision.kind === 'fallback'
				? freezeInPlace({ editorSeed: session.snippet, mode: 'editor' })
				: freezeInPlace({
						mode: 'lens',
						openLensName: decision.lens.name,
						opened: {},
						openedAt: settled,
					});
		},
	);

	// An eagerly-written mirror of the occupant: the open/dispose guards
	// read it, so a same-batch double-commit can neither double-dispatch a
	// close nor miss a dispose (the render-closure value could be stale
	// there).
	const occupantReference = React.useRef(occupant);
	occupantReference.current = occupant;

	// 5. Announce the settle AFTER the derived state commits — once per
	// settle (the ref guard absorbs StrictMode's double-run). Seeded with
	// the INITIAL settled pair: the diagram's only announce edge is
	// Settling → Idle, and a mount-time derivation has no subscribers to
	// hear it — only edit- and toggle-driven settles announce.
	const announced = React.useRef<SettledSnippet | null>(settled);
	React.useEffect(
		function announceSettled() {
			if (announced.current !== settled) {
				announced.current = settled;
				session.bus.dispatch('settled', settled);
			}
		},
		[session, settled],
	);

	function commitLevel(key: string): void {
		// The uniform dispose rule (see commitType): close first, then commit.
		disposeToEditor();
		setSelectedLevelKey(key);
		session.bus.dispatch('level-selected', { key });
	}

	function commitPosture(next: boolean): void {
		// The uniform dispose rule (see commitType): close first, then commit.
		disposeToEditor();
		setStrict(next);
		session.bus.dispatch('posture-toggled', { strict: next });
	}

	function commitType(): void {
		// The uniform dispose rule: a derivation-context change closes the
		// open lens FIRST (silent with nothing open), so the close dispatch
		// precedes the change event and no mount ever sees its context move.
		disposeToEditor();
		const next = type === 'module' ? 'script' : 'module';
		setType(next);
		session.bus.dispatch('type-toggled', { type: next });
	}

	// The two pane transitions every open and close path routes through.
	// The occupant ref is written EAGERLY (before the state commit) so the
	// guards stay correct within one synchronous batch. The opened
	// overrides live on the lens arm, so they cannot outlive the choice.
	function openLensSurface(
		lensName: string,
		opened: ConfigOverridesByLens,
	): void {
		// The flush-at-open: absorb any pending settle so the lens mounts on
		// the EXACT buffer (identity retained when nothing was pending — no
		// re-derivation, no re-announce). The coherence anchor is built from
		// the SAME live values the flush settles with — both commit in one
		// batch, so the render invariants' field-equality holds; anchoring
		// `settled` here instead would capture the stale pre-flush closure.
		settleNow();
		occupantReference.current = freezeInPlace({
			mode: 'lens',
			openLensName: lensName,
			opened,
			openedAt: freezeInPlace({ source: readLiveSource(), type }),
		});
		setOccupant(occupantReference.current);
		session.bus.dispatch(LENS_OPENED, { lens: lensName });
	}

	// Idle-safe: a dispose with nothing open commits nothing and announces
	// nothing (the bus contract's "dispose with nothing open is silent").
	// The editor arm's seed is the LIVE buffer — edits survive the
	// excursion in the settle hook's slot, and the remount reads it here.
	function disposeToEditor(): void {
		if (occupantReference.current.mode !== 'lens') return;
		occupantReference.current = freezeInPlace({
			editorSeed: readLiveSource(),
			mode: 'editor',
		});
		setOccupant(occupantReference.current);
		session.bus.dispatch(LENS_OPENED, { lens: null });
	}

	function commitOpenLens(lensName: string): void {
		openLensSurface(lensName, {});
	}

	function commitCloseLens(): void {
		disposeToEditor();
	}

	function commitOpenRecommended(proposal: Recommendation): void {
		openLensSurface(proposal.lens.name, {
			[proposal.lens.name]: proposal.config,
		});
	}

	// The orphan defense — the reachability judgment's SECOND projection
	// (the render gate below is the first; one judgment, two projections,
	// per DOCS § Structural constraints). An open lens the CURRENT
	// derivation rejects — a phase-declared lens with every attaching phase
	// barred, or a panel-excluded lens whose applicability lapsed over the
	// flushed facts — is disposed rather than left orphaned in the pane.
	// Reachability can lapse mid-mount only through the flush-at-open (the
	// loop is frozen otherwise), so this fires in the same effect pass as
	// the flush's settled announce — AFTER it, by the pinned registration
	// order.
	React.useEffect(
		function closeOrphanedOpenLens() {
			if (occupant.mode !== 'lens') return;
			const open = session.lenses.find(
				(candidate) => candidate.name === occupant.openLensName,
			);
			if (!open) return;
			if (!isOpenLensReachable(open, derivation.embodiment)) {
				disposeToEditor();
			}
		},
		// disposeToEditor and the hook's live-source read are per-render by
		// contract (never deps); both read only refs plus the stable
		// session, so the closure cannot go stale in a way that matters.
		[derivation, occupant, session],
	);

	// 6. The render projection — phases zipped against embody's runtime
	// order constant; the selector mounts only when levels are registered;
	// the mask projects the SELECTED level's assessment crossed with the
	// posture over the class-3 surfaces (an inert overlay — everything
	// beneath stays mounted). ONE VISUAL PANE, TWO DOM SLOTS: the class-1
	// editor renders in its own slot OUTSIDE both maskable containers; the
	// open lens renders INSIDE the maskable content region (class 3) — the
	// pane swap must never merge the two slots, or one class assignment
	// breaks.
	const phases = LIFECYCLE_PHASE_ORDER.map((name) =>
		toPhaseEntry(name, derivation.embodiment.study[name], session.lenses),
	);
	const openLens =
		occupant.mode === 'lens'
			? (session.lenses.find(
					(candidate) => candidate.name === occupant.openLensName,
				) ?? null)
			: null;

	if (occupant.mode === 'lens') {
		assertPaneCoherence(occupant, settled, openLens);
	}

	// The reachability judgment's FIRST projection: when the current
	// derivation rejects the open lens (a flush-at-open can do this — the
	// offer was made against pre-flush facts), the pane renders nothing
	// this frame and the orphan defense disposes post-commit. A lens's
	// main never mounts against an embodiment its applicability rejected.
	const openLensReachable =
		occupant.mode === 'lens' && openLens !== null
			? isOpenLensReachable(openLens, derivation.embodiment)
			: false;
	const selectedLevel =
		session.levels.find((level) => level.key === selectedLevelKey) ?? null;
	const mask = deriveMask({
		assessment: selectedLevel
			? derivation.assessments[selectedLevel.key]
			: null,
		levelLabel: selectedLevel?.label ?? '',
		strict,
	});

	return (
		<div data-study-lenses>
			<div
				data-control-row
				style={{
					alignItems: 'center',
					display: 'flex',
					flexWrap: 'wrap',
					gap: '0.75rem',
					marginBottom: '0.5rem',
				}}
			>
				{occupant.mode === 'lens' ? (
					<button data-edit-return onClick={commitCloseLens} type="button">
						Edit code
					</button>
				) : null}
				<button
					aria-label={`snippet type: ${type} — switch to ${type === 'module' ? 'script' : 'module'}`}
					data-type-toggle
					onClick={commitType}
					type="button"
				>
					{type}
				</button>
				{session.levels.length > 0 ? (
					<LevelSelector
						noneLabel="plain JavaScript"
						onSelectLevel={commitLevel}
						onToggleStrict={commitPosture}
						options={session.levels.map((level) => ({
							docs: level.docs.reference,
							key: level.key,
							label: level.label,
							mark: derivation.assessments[level.key].mark,
						}))}
						selectedKey={selectedLevelKey}
						strict={strict}
					/>
				) : null}
			</div>
			<div
				data-maskable
				inert={mask.masked || undefined}
				style={{
					marginBottom: '0.5rem',
					opacity: mask.masked ? 0.4 : 1,
				}}
			>
				<PhasesPanel
					onCloseLens={commitCloseLens}
					onOpenLens={(intent) => commitOpenLens(intent.lens)}
					openLensName={occupant.mode === 'lens' ? occupant.openLensName : null}
					phases={phases}
				/>
			</div>
			{occupant.mode === 'editor' ? (
				<Editor onEdit={onEdit} snippet={occupant.editorSeed} />
			) : null}
			<div style={{ position: 'relative' }}>
				<div data-maskable inert={mask.masked || undefined}>
					{occupant.mode === 'lens' && openLens && openLensReachable ? (
						<MountedLens
							configs={configs}
							embodiment={derivation.embodiment}
							lens={openLens}
							opened={occupant.opened}
						/>
					) : null}
					{derivation.recommendations.length > 0 ? (
						<section data-recommendations>
							{derivation.recommendations.map((proposal, index) => (
								<button
									data-recommendation={proposal.lens.name}
									key={`${proposal.label}·${index}`}
									onClick={() => commitOpenRecommended(proposal)}
									type="button"
								>
									{proposal.label}
								</button>
							))}
						</section>
					) : null}
				</div>
				{mask.masked ? (
					<div
						data-enforcement-mask
						style={{
							alignItems: 'center',
							backgroundColor: 'var(--ifm-background-surface-color, #fff)',
							display: 'flex',
							inset: 0,
							justifyContent: 'center',
							opacity: 0.92,
							position: 'absolute',
						}}
					>
						<p data-enforcement-cause role="status">
							{formatBlockedSentence(mask)}
						</p>
					</div>
				) : null}
			</div>
			<Guide />
		</div>
	);
}

// The one bus event three commit paths share.
const LENS_OPENED = 'lens-opened';

// The pane's coherence invariants — loud in dev AND prod. Unreachable
// through the public surface by construction (the flush anchors every open,
// every derivation-context commit disposes first, and proposals are vetted
// at collection); reachable only by a future regression, which must crash,
// never drift.
function assertPaneCoherence(
	occupant: Extract<PaneOccupant, { mode: 'lens' }>,
	settled: SettledSnippet,
	openLens: Lens | null,
): void {
	if (settled.source !== occupant.openedAt.source) {
		throw new Error(
			'orchestrator invariant violated: the open lens must render against its open-time source',
		);
	}

	if (settled.type !== occupant.openedAt.type) {
		throw new Error(
			'orchestrator invariant violated: the open lens must render against its open-time type',
		);
	}

	if (openLens === null) {
		throw new Error(
			`orchestrator invariant violated: open lens "${occupant.openLensName}" is not on the mount roster`,
		);
	}
}

// The blocked state's single upstream author: the level's label plus the
// first violation in the machine's own words, or the admitted types the
// level applies to — structural cause in, one learner-facing sentence out.
function formatBlockedSentence(
	masked: Extract<MaskState, { masked: true }>,
): string {
	if (masked.cause.kind === 'violation') {
		return `${masked.levelLabel}: ${masked.cause.violation.message}`;
	}

	return `${masked.levelLabel} applies to ${masked.cause.admitted.join(' / ')} programs — toggle the type or pick another level`;
}

// The opened lens, mounted with the frozen embodiment and its resolved
// configuration — the host layer from the configs prop, the opened layer
// from a recommendation-opened mount. The learner layer is empty until its
// producer exists (session tweaks have no UI yet).
function MountedLens({
	lens,
	embodiment,
	configs,
	opened,
}: {
	readonly lens: Lens;
	readonly embodiment: Embodiment;
	readonly configs: NonNullable<StudyLensesProperties['configs']>;
	readonly opened: ConfigOverridesByLens;
}): React.JSX.Element {
	const Main = lens.main;
	const config = resolveLensConfig(lens, {
		host: configs,
		opened,
		learner: {},
	});
	return <Main config={config} embodiment={embodiment} />;
}

// One phase's panel entry: the display label zipped by phase name; an
// accessible phase lists its renderable lens NAMES (recovered against the
// joined roster); a barred phase carries the parser's message as display
// copy — the structured cause never crosses into the panel.
function toPhaseEntry(
	name: LifecyclePhaseName,
	phase: LifecyclePhase,
	roster: JoinedLensRoster,
): PhaseEntry {
	const label = DISPLAY_LABELS[name];
	if (!phase.accessible) {
		return { accessible: false, cause: phase.cause.message, label, name };
	}

	return {
		accessible: true,
		label,
		lenses: recoverRenderableLenses(roster, phase.lenses).map(
			(lens) => lens.name,
		),
		name,
	};
}
