/**
 * @file The SOURCE registry — the single ordered list of orchestrator-level
 * question sources (`sources/registry.ts`, one level above quizzing's own
 * `generators/registry.ts`). The composition pass runs the sources in this order
 * and `flatMap`s their items, so **registry order is emission order** — and the
 * ladder's tie-break falls back to it. A new kind of question generator is one
 * adapter file plus one entry here.
 */

import type { QuestionSource } from '../types.js';

import quizzingSource from './quizzing-source.js';
import socratizingSource from './socratizing-source.js';

const SOURCES: readonly QuestionSource[] = [quizzingSource, socratizingSource];

export default SOURCES;
