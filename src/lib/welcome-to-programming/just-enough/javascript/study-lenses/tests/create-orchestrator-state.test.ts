/**
 * @file Unit tests for `createOrchestratorState`.
 *
 * ZOMBIES order: Zero → One → Many → Boundaries → Interfaces → Simple.
 * No exceptions — the factory has no failure modes at runtime (TypeScript
 * guarantees input shape; all inputs produce valid output).
 */

import { describe, expect, it } from 'vitest';

import createOrchestratorState from '../create-orchestrator-state.js';

describe('createOrchestratorState', () => {
	describe('Z — minimal inputs (empty transforms, required fields only)', () => {
		it('snippet starts equal to originalCode', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: [],
			});

			expect(state.snippet).toBe('hi');
		});

		it('activeLens starts equal to initialLens', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: [],
			});

			expect(state.activeLens).toBe('editor');
		});

		it('activeTransforms value-equals initialTransforms', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: [],
			});

			expect(state.activeTransforms).toEqual(state.initialTransforms);
		});

		it('snippetName defaults to empty string when omitted', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: [],
			});

			expect(state.snippetName).toBe('');
		});
	});

	describe('O — one transform', () => {
		it('initialTransforms contains the single transform name', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: ['format'],
			});

			expect(state.initialTransforms).toEqual(['format']);
		});
	});

	describe('M — multiple transforms', () => {
		it('preserves declared order in initialTransforms', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: ['format', 'loopGuard'],
			});

			expect(state.initialTransforms).toEqual(['format', 'loopGuard']);
		});

		it('activeTransforms also preserves order', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: ['format', 'loopGuard'],
			});

			expect(state.activeTransforms).toEqual(['format', 'loopGuard']);
		});
	});

	describe('B — boundaries', () => {
		it('empty originalCode produces empty snippet', () => {
			const state = createOrchestratorState({
				originalCode: '',
				initialLens: 'editor',
				initialTransforms: [],
			});

			expect(state.snippet).toBe('');
		});

		it('provided snippetName is stored', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: [],
				snippetName: 'my exercise',
			});

			expect(state.snippetName).toBe('my exercise');
		});
	});

	describe('I — returned shape', () => {
		it('returned state is frozen', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: ['format'],
			});

			expect(Object.isFrozen(state)).toBe(true);
		});

		it('initialTransforms array is frozen (deep-frozen)', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: ['format'],
			});

			expect(Object.isFrozen(state.initialTransforms)).toBe(true);
		});

		it('does not retain a reference to the caller-provided transforms array', () => {
			const callerArray = ['format', 'loopGuard'];
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: callerArray,
			});

			expect(state.initialTransforms).not.toBe(callerArray);
		});

		it('activeTransforms array is frozen (deep-frozen)', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: ['format'],
			});

			expect(Object.isFrozen(state.activeTransforms)).toBe(true);
		});

		it('activeTransforms shares the same frozen reference as initialTransforms at creation', () => {
			const state = createOrchestratorState({
				originalCode: 'hi',
				initialLens: 'editor',
				initialTransforms: ['format', 'loopGuard'],
			});

			expect(state.activeTransforms).toBe(state.initialTransforms);
		});
	});

	describe('S — full happy-path state', () => {
		it('returns the expected shape for a complete input', () => {
			const state = createOrchestratorState({
				originalCode: 'console.log(1)',
				initialLens: 'editor',
				initialTransforms: ['format', 'loopGuard'],
				snippetName: 'my exercise',
			});

			expect(state).toEqual({
				originalCode: 'console.log(1)',
				snippet: 'console.log(1)',
				initialLens: 'editor',
				activeLens: 'editor',
				initialTransforms: ['format', 'loopGuard'],
				activeTransforms: ['format', 'loopGuard'],
				snippetName: 'my exercise',
			});
		});
	});
});
