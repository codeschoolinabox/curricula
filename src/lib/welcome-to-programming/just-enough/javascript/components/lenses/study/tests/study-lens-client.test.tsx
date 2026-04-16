// @vitest-environment jsdom
/**
 * @file Unit tests for `<StudyLensClient>` — the browser-only client
 * that owns the CodeMirror editor's React lifecycle.
 *
 * The `createEditor` factory is mocked at module scope. Each test
 * starts with a fresh factory (state reset in `beforeEach`) so call
 * counts and instance tracking don't leak across tests.
 *
 * Covered scenarios:
 * - Happy path: mount → await → attach
 * - Factory arg shape (triangulation of happy path)
 * - Unmount-before-resolve race (cancelled flag)
 * - Unmount-after-resolve (destroy called once)
 * - Hot-reload safety: prop change ≠ remount
 * - StrictMode double-invoke: first instance destroyed, one editor visible
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, act, cleanup, waitFor } from '@testing-library/react';

import type { EditorInstance } from '../../../../lib/editing/types.js';

// Track factory state across mocked calls. Tests assert against these.
type MockInstance = EditorInstance & {
	destroyCalls: number;
};
let factoryCalls: Array<{
	code: string;
	options: { language?: string; format?: unknown; parent?: HTMLElement };
}> = [];
let createdInstances: MockInstance[] = [];
// A test primes `nextResolver` to capture the next factory promise's
// `resolve` callback; the test then calls that captured callback at a
// specific moment to simulate a delayed factory resolution.
let nextResolver:
	| ((resolveNow: (instance: MockInstance) => void) => void)
	| null = null;

function makeMockInstance(code: string, parent?: HTMLElement): MockInstance {
	const el = document.createElement('div');
	el.className = 'cm-editor-mock';
	if (parent) parent.appendChild(el);
	const instance = {
		content: code,
		el,
		reset: vi.fn(),
		format: vi.fn(),
		check: () => [],
		destroy: vi.fn(function destroy(this: MockInstance) {
			this.destroyCalls++;
			if (el.parentNode) el.parentNode.removeChild(el);
		}),
		destroyCalls: 0,
	} as unknown as MockInstance;
	createdInstances.push(instance);
	return instance;
}

vi.mock('../../../../lib/editing/create-editor.js', () => ({
	default: vi.fn(
		(code: string, options: { parent?: HTMLElement } & Record<string, unknown>) => {
			factoryCalls.push({
				code,
				options: options as { language?: string; format?: unknown; parent?: HTMLElement },
			});
			// When a test is using the deferred pattern, hand the resolver
			// to the test via `nextResolver` instead of auto-resolving.
			if (nextResolver !== null) {
				const capturedResolver = nextResolver;
				nextResolver = null;
				return new Promise<MockInstance>((resolve) => {
					capturedResolver(resolve);
				});
			}
			return Promise.resolve(makeMockInstance(code, options.parent));
		},
	),
}));

// Same stub as the shell test — aliased globally in vitest.workspace.ts
// would be cleaner, but `api/format.ts` has no import-resolution issue
// so we don't need a stub here.

import StudyLensClient from '../study-lens-client.js';

beforeEach(() => {
	factoryCalls = [];
	createdInstances = [];
	nextResolver = null;
});

describe('StudyLensClient', () => {
	it('happy path: mounts and attaches the editor DOM to the container', async () => {
		const { container } = render(
			<StudyLensClient code="let x = 1;" options={{}} />,
		);
		// Await the factory microtask.
		await act(async () => {
			await Promise.resolve();
		});
		const mock = container.querySelector('.cm-editor-mock');
		expect(mock).not.toBeNull();
		expect(factoryCalls).toHaveLength(1);
		expect(factoryCalls[0]?.code).toBe('let x = 1;');
		// AR-3 #3: the factory's `parent` option is the lens's container div
		// — production's `editor.el === parent` contract depends on this.
		// Without the assertion, the mock accepts `parent: undefined` and
		// creates an orphan el, which a silent regression could introduce.
		const wrapper = container.querySelector('[data-study-lens="study"]');
		expect(factoryCalls[0]?.options.parent).toBe(wrapper);
		cleanup();
	});

	it('triangulation: createEditor receives a function for `format`', async () => {
		render(<StudyLensClient code="x" options={{}} />);
		await act(async () => {
			await Promise.resolve();
		});
		expect(typeof factoryCalls[0]?.options.format).toBe('function');
		expect(factoryCalls[0]?.options.language).toBe('javascript');
		cleanup();
	});

	it('unmount-before-resolve: resolved instance is destroyed, not attached', async () => {
		// Arm the deferred-resolve slot: next factory call returns a pending
		// promise; test calls releaseFactory() AFTER unmount to resolve it.
		let releaseFactory!: () => void;
		nextResolver = (resolveNow) => {
			releaseFactory = () => resolveNow(makeMockInstance('x'));
		};

		const { unmount, container } = render(
			<StudyLensClient code="x" options={{}} />,
		);
		// Factory called but hasn't resolved yet.
		expect(factoryCalls).toHaveLength(1);

		// Unmount while factory is in flight.
		unmount();

		// Now resolve the factory.
		await act(async () => {
			releaseFactory();
			await Promise.resolve();
			await Promise.resolve();
		});

		// The resolved instance must be destroyed and not attached to the container.
		expect(container.querySelector('.cm-editor-mock')).toBeNull();
		const lastInstance = createdInstances.at(-1);
		expect(lastInstance?.destroyCalls).toBe(1);
	});

	it('unmount-after-resolve: destroy called exactly once', async () => {
		const { unmount } = render(<StudyLensClient code="x" options={{}} />);
		await act(async () => {
			await Promise.resolve();
		});
		expect(createdInstances).toHaveLength(1);
		const instance = createdInstances[0]!;
		expect(instance.destroyCalls).toBe(0);
		unmount();
		expect(instance.destroyCalls).toBe(1);
	});

	it('hot-reload safety: code prop change does NOT remount the editor', async () => {
		const { rerender } = render(
			<StudyLensClient code="first" options={{}} />,
		);
		await act(async () => {
			await Promise.resolve();
		});
		expect(factoryCalls).toHaveLength(1);
		expect(createdInstances).toHaveLength(1);
		const firstInstance = createdInstances[0]!;
		expect(firstInstance.destroyCalls).toBe(0);

		rerender(<StudyLensClient code="second" options={{}} />);
		await act(async () => {
			await Promise.resolve();
		});

		// Empty dep array ⇒ effect doesn't re-run; factory not re-invoked;
		// existing instance not destroyed.
		expect(factoryCalls).toHaveLength(1);
		expect(createdInstances).toHaveLength(1);
		expect(firstInstance.destroyCalls).toBe(0);
		cleanup();
	});

	it('StrictMode double-invoke: first instance destroyed, exactly one editor survives', async () => {
		const { container } = render(
			<React.StrictMode>
				<StudyLensClient code="x" options={{}} />
			</React.StrictMode>,
		);
		// AR-3 #2: use `waitFor` for StrictMode timing. The factory's async
		// chain has multiple microtasks between the mount-cleanup-mount
		// cycle; fixed tick counts were flake-prone.
		await waitFor(() => expect(createdInstances).toHaveLength(2));
		await waitFor(() => {
			const mocks = container.querySelectorAll('.cm-editor-mock');
			expect(mocks).toHaveLength(1);
		});
		// First instance destroyed once (from cleanup between the two mounts);
		// second instance alive.
		expect(createdInstances[0]!.destroyCalls).toBe(1);
		expect(createdInstances[1]!.destroyCalls).toBe(0);
		cleanup();
	});
});
