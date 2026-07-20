// cspell:ignore renderable Renderable

/**
 * StudyLenses — the one component the host mounts, and the region's
 * composition root: the mount-time joins (loud), the session choices'
 * single owner, the per-instance bus and memoized validate, the settle
 * loop, one study derivation per settle, and the render projection over
 * the editor, the study panel, the level UI, the type toggle, and the
 * guide.
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
import type { Lens } from '../lenses/types.js';

import deriveStudyState from './derive-study-state.js';
import DISPLAY_LABELS from './display-labels.js';
import Editor from './editor/index.jsx';
import createEventBus from './event-bus/create-event-bus.js';
import Guide from './guide/index.jsx';
import LevelSelector from './level-ui/index.jsx';
import joinLensRoster from './lib/composing/join-lens-roster.js';
import joinLevelRoster from './lib/composing/join-level-roster.js';
import recoverRenderableLenses from './lib/composing/recover-renderable-lenses.js';
import resolveLensConfig from './lib/composing/resolve-lens-config.js';
import type { JoinedLensRoster } from './lib/composing/types.js';
import createMemoizedValidate from './lib/validating/create-memoized-validate.js';
import PhasesPanel from './phases-panel/index.jsx';
import type { PhaseEntry } from './phases-panel/types.js';
import type { SettledSnippet, StudyLensesProperties } from './types.js';
import useSettledSnippet from './use-settled-snippet.js';

export default function StudyLenses({
	snippet,
	type: initialType = 'module',
	configs = {},
	lenses: injectedLenses = [],
	languageLevels: injectedLevels = [],
	activeLanguageLevel = '',
	strictLanguageLevels = false,
}: StudyLensesProperties): React.JSX.Element {
	// 1. Compose at mount — joins loud at the author's desk; one bus and one
	// memoized validate per instance, held for the component's lifetime.
	const [session] = React.useState(() =>
		freezeInPlace({
			bus: createEventBus(),
			lenses: joinLensRoster(injectedLenses),
			levels: joinLevelRoster(injectedLevels),
			validate: createMemoizedValidate(),
		}),
	);

	// 2. Session choices — this component is their single owner; surfaces
	// raise intent, the commits below change state AND announce on the bus.
	const [selectedLevelKey, setSelectedLevelKey] =
		React.useState(activeLanguageLevel);
	const [strict, setStrict] = React.useState(strictLanguageLevels);
	const [type, setType] = React.useState(initialType);
	const [openLensName, setOpenLensName] = React.useState<string | null>(null);

	// 3. The settle loop and the one derivation per settle.
	const { settled, onEdit } = useSettledSnippet({
		initialSource: snippet,
		type,
	});
	const derivation = React.useMemo(
		() =>
			deriveStudyState(
				settled,
				session.levels,
				session.lenses,
				session.validate,
			),
		[session, settled],
	);

	// 4. Announce the settle AFTER the derived state commits — once per
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

	function commitOpenLens(lensName: string): void {
		setOpenLensName(lensName);
		session.bus.dispatch('lens-opened', { lens: lensName });
	}

	// 5. The render projection — phases zipped against embody's runtime
	// order constant; the selector mounts only when levels are registered.
	const phases = LIFECYCLE_PHASE_ORDER.map((name) =>
		toPhaseEntry(name, derivation.embodiment.study[name], session.lenses),
	);
	const openLens =
		openLensName === null
			? null
			: (session.lenses.find((lens) => lens.name === openLensName) ?? null);

	return (
		<div data-study-lenses>
			<Editor onEdit={onEdit} snippet={snippet} />
			<button data-type-toggle onClick={commitType} type="button">
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
			<PhasesPanel
				onOpenLens={(intent) => commitOpenLens(intent.lens)}
				phases={phases}
			/>
			{openLens ? (
				<MountedLens
					configs={configs}
					embodiment={derivation.embodiment}
					lens={openLens}
				/>
			) : null}
			<Guide />
		</div>
	);
}

// The opened lens, mounted with the frozen embodiment and its resolved
// configuration. The opened and learner cascade layers are empty until
// their producers exist (a recommendation-opened mount; learner tweaks).
function MountedLens({
	lens,
	embodiment,
	configs,
}: {
	readonly lens: Lens;
	readonly embodiment: Embodiment;
	readonly configs: NonNullable<StudyLensesProperties['configs']>;
}): React.JSX.Element {
	const Main = lens.main;
	const config = resolveLensConfig(lens, {
		host: configs,
		opened: {},
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
