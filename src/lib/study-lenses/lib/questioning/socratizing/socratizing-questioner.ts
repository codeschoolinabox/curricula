// cspell:ignore socratizing Socratizing

/**
 * @file The socratizing questioner — the open register's leaf questioner:
 * the live engine behind the family's `Questioner` envelope
 * (`../types.ts`). Wrapper only: the engine's entry IS the ask; nothing
 * here re-implements or re-configures analysis. `serves` mirrors the
 * engine's two refusal arms (a failed AST or a failed scope environment),
 * so serves-false predicts exactly the inputs ask would refuse — a
 * tighter serve/refuse alignment than the kind requires.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { Facts } from '../../../embody/types.js';
import type { Questioner } from '../types.js';

import analyzeMicroDecisions from './analyze-micro-decisions.js';
import type { MicroDecisionConfig, MicroDecisionResult } from './types.js';

/** The engine result's success arm — this questioner's answer shape. */
type SocratizingAnswer = Extract<MicroDecisionResult, { ok: true }>;

const socratizingQuestioner = freezeInPlace({
	name: 'socratizing',
	serves: (facts: Facts) => facts.ast.ok && facts.environment.ok,
	ask: analyzeMicroDecisions,
} satisfies Questioner<SocratizingAnswer, MicroDecisionConfig>);

export default socratizingQuestioner;
