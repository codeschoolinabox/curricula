// cspell:ignore socratizing quizzing

/**
 * @file The generator registry contract (DOCS § Execution phases, the run phase). A
 * `Generator` declares the **anchor type** it binds to; the run phase selects the
 * matching stream from the generation context and owns the iteration, so the
 * generator body never iterates. The three-way anchor axis (token / node /
 * program) extends socratizing's two-way point / program split, because
 * classifying's output is token-indexed (a token is not an AST node).
 */

import type { ClassifiedToken } from '../../../classifying/types.js';
import type { GenerationContext, IdentifierAnchor } from '../context/types.js';
import type { QuizItem } from '../types.js';

/**
 * One registered generator, discriminated on `anchorType` so each arm pins the
 * stream item its `build` receives:
 * - `token` — fires per `classified` token (the category-ID form).
 * - `node` — fires per identifier anchor from the single AST descent
 *   (usage-kind, declaration-site, …).
 * - `program` — fires once over the whole program (the macro forms).
 *
 * `build` returns zero or more `QuizItem`s, so generation is **selective** (a
 * form emits only where it applies). The `context` is supplied to every `build`
 * for the binding / scope views later forms read.
 */
export type Generator =
	| Readonly<{
			anchorType: 'token';
			build: (
				token: ClassifiedToken,
				context: GenerationContext,
			) => readonly QuizItem[];
	  }>
	| Readonly<{
			anchorType: 'node';
			build: (
				anchor: IdentifierAnchor,
				context: GenerationContext,
			) => readonly QuizItem[];
	  }>
	| Readonly<{
			anchorType: 'program';
			build: (context: GenerationContext) => readonly QuizItem[];
	  }>;
