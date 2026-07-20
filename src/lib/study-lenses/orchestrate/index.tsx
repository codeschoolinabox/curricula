// cspell:ignore renderable Renderable

/**
 * StudyLenses — the one component the host mounts, and the region's
 * composition root: the mount-time joins (loud), the session choices'
 * single owner, the per-instance bus and memoized validate, the settle
 * loop, one study derivation per settle, and the render projection over
 * the editor, the study panel, the level UI, the type toggle, the ranked
 * recommendations, and the guide.
 *
 * @remarks
 * Selector contract: `data-study-lenses` on the root;
 * `data-type-toggle` on the snippet-type toggle (its text is the CURRENT
 * type; clicking commits the other one); the mounted surfaces carry their
 * own documented attributes. Session choices commit here and announce on
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
import deriveMask from './lib/masking/derive-mask.js';
import type { MaskState } from './lib/masking/types.js';
import createMemoizedValidate from './lib/validating/create-memoized-validate.js';
import PhasesPanel from './phases-panel/index.jsx';
import type { PhaseEntry } from './phases-panel/types.js';
import type { SettledSnippet, StudyLensesProperties } from './types.js';
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
	const { settled, onEdit } = useSettledSnippet({
		initialSource: session.snippet,
		type,
	});
	const derivation = React.useMemo(
		() =>
			deriveStudy(settled, session.levels, session.lenses, session.validate),
		[session, settled],
	);

	// 4. The honor resolution — once, at mount (the lazy initializer): the
	// focus request resolves through fit and accessibility against the
	// first derivation. An honored mount is initial state, never a
	// committed session choice — nothing announces, and the learner
	// overrides it through the same commit path as any open. StrictMode
	// double-invokes this initializer in dev, so a THROWING applicability
	// reports twice there — dev-only, accepted.
	const [openLensName, setOpenLensName] = React.useState<string | null>(
		function resolveHonoredFocus() {
			const decision = honorFocusRequest({
				embodiment: derivation.embodiment,
				roster: session.lenses,
				...(lens === undefined ? {} : { request: lens }),
			});
			return decision.kind === 'fallback' ? null : decision.lens.name;
		},
	);

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
		setSelectedLevelKey(key);
		session.bus.dispatch('level-selected', { key });
	}

	function commitPosture(next: boolean): void {
		setStrict(next);
		session.bus.dispatch('posture-toggled', { strict: next });
	}

	function commitType(): void {
		const next = type === 'module' ? 'script' : 'module';
		setType(next);
		session.bus.dispatch('type-toggled', { type: next });
	}

	// The opened cascade layer — set at a recommendation-opened mount,
	// cleared with the open-lens choice; nothing else touches it.
	const [openedOverrides, setOpenedOverrides] =
		React.useState<ConfigOverridesByLens>({});

	function commitOpenLens(lensName: string): void {
		setOpenLensName(lensName);
		setOpenedOverrides({});
		session.bus.dispatch('lens-opened', { lens: lensName });
	}

	function commitOpenRecommended(proposal: Recommendation): void {
		setOpenLensName(proposal.lens.name);
		setOpenedOverrides({ [proposal.lens.name]: proposal.config });
		session.bus.dispatch('lens-opened', { lens: proposal.lens.name });
	}

	// 6. The render projection — phases zipped against embody's runtime
	// order constant; the selector mounts only when levels are registered;
	// the mask projects the SELECTED level's assessment crossed with the
	// posture over the class-3 surfaces (an inert overlay — everything
	// beneath stays mounted; the class-1 editor and class-2 controls sit
	// outside the maskable container).
	const phases = LIFECYCLE_PHASE_ORDER.map((name) =>
		toPhaseEntry(name, derivation.embodiment.study[name], session.lenses),
	);
	const openLens =
		openLensName === null
			? null
			: (session.lenses.find((candidate) => candidate.name === openLensName) ??
				null);
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
			<Editor onEdit={onEdit} snippet={session.snippet} />
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
			<div style={{ position: 'relative' }}>
				<div data-maskable inert={mask.masked || undefined}>
					<PhasesPanel
						onOpenLens={(intent) => commitOpenLens(intent.lens)}
						phases={phases}
					/>
					{openLens ? (
						<MountedLens
							configs={configs}
							embodiment={derivation.embodiment}
							lens={openLens}
							opened={openedOverrides}
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
