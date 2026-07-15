// cspell:ignore Gateable

/**
 * The lens kind's contract: what every lens under `lenses/<name>/` exports.
 * A lens is the component kind of study utility — `Gateable` (embody's
 * structural view) extended with the fields only a component needs.
 *
 * Region docs: ./README.md (kind mechanics) · ./DOCS.md (architecture).
 * The package glossary (../README.md) owns the shared vocabulary.
 */

import type { ComponentType } from 'react';

import type { Embodiment, Gateable } from '../embody/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The only value types `LensConfig` admits. Functions, symbols, dates, and
 * class instances are excluded so config hashes stay deterministic.
 */
export type SerializablePrimitive = string | number | boolean | null;

export type SerializableValue =
	| SerializablePrimitive
	| ReadonlyArray<SerializablePrimitive>;

/**
 * A lens's configuration — a flat record of primitives and primitive
 * arrays. Flat by design: per-lens defaults merge with host overrides and
 * learner tweaks without schema drift.
 */
export type LensConfig = Readonly<Record<string, SerializableValue>>;

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What every lens's main component receives — exactly two things.
 *
 * @remarks
 * Both arrive frozen; a lens never mutates either. `config` here is the
 * RESOLVED record — the output of the lens's `config` factory (same word,
 * two roles: the envelope field is the factory, this prop is its result).
 * No phase discriminator crosses: a multi-phase lens derives what to show
 * from the facts alone.
 */
export type LensProperties = {
	readonly embodiment: Embodiment;
	readonly config: LensConfig;
};

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A lens's proposal of a next study step. Proposed by a lens's `recommend`;
 * ranked and rendered by the orchestrator, through the enforcement mask.
 */
export type Recommendation = {
	/**
	 * The proposed lens — usually a self-reference closing over the module
	 * const; a lens may also propose another lens it imports. Injected
	 * lenses cannot be targeted this way — accepted.
	 */
	readonly lens: Lens;
	/**
	 * Configuration overrides the proposal opens with. They enter the
	 * target lens's cascade as an override layer — the learner's own tweaks
	 * stay the final layer, and the target's factory still applies.
	 */
	readonly config: Partial<LensConfig>;
	/**
	 * Normalized to the 0–1 range, higher ranks first — the shared scale
	 * that makes ranking across lenses meaningful.
	 */
	readonly relevance: number;
	/** The proposal's own display copy. */
	readonly label: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// The lens kind
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The component kind of study utility: `Gateable` extended — strictly
 * additively — with the component-kind fields.
 *
 * @remarks
 * Totality: `main` may assume this lens's applicability held over the
 * embodiment's facts; mounting it otherwise is a consumer bug. For this
 * kind, refusal-as-data is realized at the gate — a lens that cannot serve
 * is never offered, so `main` carries no refusal arm.
 */
export type Lens = Gateable & {
	/** The React component — a thin wrapper over the lens's pure core. */
	readonly main: ComponentType<LensProperties>;
	/**
	 * Pure factory (the envelope's `config` role): receives the cascade's
	 * merged overrides, returns the complete configuration — defaults live
	 * inside. Absent = the shared merge applies the cascade directly. An
	 * override key present with `undefined` is treated as absent; `null` is
	 * a value.
	 */
	readonly config?: (overrides?: Partial<LensConfig>) => LensConfig;
	/** Propose next study steps for this embodiment. */
	readonly recommend?: (
		embodiment: Embodiment,
	) => ReadonlyArray<Recommendation>;
};
