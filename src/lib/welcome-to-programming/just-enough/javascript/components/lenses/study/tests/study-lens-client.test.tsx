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
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
	render,
	act,
	cleanup,
	waitFor,
	fireEvent,
} from '@testing-library/react';

import type { EditorInstance } from '../../../../lib/editing/types.js';

// Track factory state across mocked calls. Tests assert against these.
type MockInstance = EditorInstance & {
	destroyCalls: number;
	contentSetCalls: string[];
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
	// `content` is a getter+setter on the production EditorInstance — CM's
	// doc lives behind those accessors. `Object.defineProperty` lets the
	// mock spy on setter calls (for Reset-button tests) and track the
	// "active code" the way CM's editor state would.
	let currentContent = code;
	const instance: MockInstance = {
		el,
		reset: vi.fn(),
		format: vi.fn(),
		check: () => [],
		destroy: vi.fn(),
		destroyCalls: 0,
		contentSetCalls: [],
	} as unknown as MockInstance;
	Object.defineProperty(instance, 'content', {
		get: () => currentContent,
		set: (value: string) => {
			instance.contentSetCalls.push(value);
			currentContent = value;
		},
		enumerable: true,
		configurable: true,
	});
	(instance as unknown as { destroy: () => void }).destroy = vi.fn(
		function destroy(this: MockInstance) {
			this.destroyCalls++;
			if (el.parentNode) el.parentNode.removeChild(el);
		},
	);
	createdInstances.push(instance);
	return instance;
}

// Mock the Run API. Tests that exercise Run prime `runImpl` with a
// controlled implementation (usually returning a PromiseLike / object
// matching api/run's return shape). Default: immediate success.
let runCalls: Array<{ code: string; config: unknown }> = [];
let runImpl: (code: string, config: unknown) => unknown = () =>
	Promise.resolve({ ok: true });

vi.mock('../../../../api/run.js', () => ({
	default: vi.fn((code: string, config: unknown) => {
		runCalls.push({ code, config });
		return runImpl(code, config);
	}),
}));

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
	runCalls = [];
	runImpl = () => Promise.resolve({ ok: true });
});

afterEach(() => {
	// Auto-cleanup: tests that share a beforeEach can't rely on
	// globals being enabled in vitest config.
	cleanup();
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

	describe('null-gate (pre-factory-resolve)', () => {
		it('initial render: all three buttons are disabled while factory is in flight', () => {
			// Deferred factory: never resolves for this test.
			nextResolver = () => {
				// intentionally hold — test doesn't release.
			};
			const { getByRole } = render(
				<StudyLensClient code="x" options={{}} />,
			);
			expect(getByRole('button', { name: /run/i }).hasAttribute('disabled')).toBe(true);
			expect(getByRole('button', { name: /format/i }).hasAttribute('disabled')).toBe(true);
			expect(getByRole('button', { name: /reset/i }).hasAttribute('disabled')).toBe(true);
			cleanup();
		});

		it('after factory resolves: all three buttons are enabled', async () => {
			const { getByRole } = render(
				<StudyLensClient code="x" options={{}} />,
			);
			await waitFor(() => {
				expect(getByRole('button', { name: /run/i }).hasAttribute('disabled')).toBe(false);
			});
			expect(getByRole('button', { name: /format/i }).hasAttribute('disabled')).toBe(false);
			expect(getByRole('button', { name: /reset/i }).hasAttribute('disabled')).toBe(false);
			cleanup();
		});
	});

	describe('Reset button', () => {
		it('unchanged content: clicking Reset sets content to original code', async () => {
			const { getByRole } = render(
				<StudyLensClient code="original" options={{}} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			const instance = createdInstances[0]!;
			expect(instance.contentSetCalls).toEqual([]);
			fireEvent.click(getByRole('button', { name: /reset/i }));
			expect(instance.contentSetCalls).toEqual(['original']);
			cleanup();
		});

		it('after simulated edit: Reset restores the ORIGINAL code (not the edit)', async () => {
			const { getByRole } = render(
				<StudyLensClient code="original" options={{}} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			const instance = createdInstances[0]!;
			// Simulate a user edit via the content setter.
			instance.content = 'edited';
			expect(instance.content).toBe('edited');
			fireEvent.click(getByRole('button', { name: /reset/i }));
			// Setter called: ['edited', 'original']. Final content is 'original'.
			expect(instance.contentSetCalls.at(-1)).toBe('original');
			expect(instance.content).toBe('original');
			cleanup();
		});
	});

	describe('Run button (async-void)', () => {
		it('click Run: invokes `run` with current editor content and default engine', async () => {
			const { getByRole } = render(
				<StudyLensClient code="let x = 1;" options={{}} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			await act(async () => {
				fireEvent.click(getByRole('button', { name: /run/i }));
			});
			expect(runCalls).toHaveLength(1);
			expect(runCalls[0]?.code).toBe('let x = 1;');
			expect(runCalls[0]?.config).toEqual({ seconds: 5 });
			cleanup();
		});

		it('options.engine overrides default engine config', async () => {
			const { getByRole } = render(
				<StudyLensClient code="x" options={{ engine: { seconds: 10 } }} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			await act(async () => {
				fireEvent.click(getByRole('button', { name: /run/i }));
			});
			expect(runCalls[0]?.config).toEqual({ seconds: 10 });
		});

		it('after edit: Run receives the EDITED content, not the original', async () => {
			const { getByRole } = render(
				<StudyLensClient code="let x = 1;" options={{}} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			const instance = createdInstances[0]!;
			instance.content = 'let x = 42;';
			await act(async () => {
				fireEvent.click(getByRole('button', { name: /run/i }));
			});
			expect(runCalls[0]?.code).toBe('let x = 42;');
			cleanup();
		});

		it('Run disabled while in flight; re-enabled after settlement', async () => {
			// Deferred runImpl: promise stays pending until test releases it.
			let releaseRun!: () => void;
			runImpl = () =>
				new Promise((resolve) => {
					releaseRun = () => resolve({ ok: true });
				});

			const { getByRole } = render(
				<StudyLensClient code="x" options={{}} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			const runBtn = getByRole('button', { name: /run/i });
			expect(runBtn.hasAttribute('disabled')).toBe(false);
			// Click → Run is in flight → button disabled.
			await act(async () => {
				fireEvent.click(runBtn);
				await Promise.resolve();
			});
			expect(runBtn.hasAttribute('disabled')).toBe(true);
			// Release the in-flight runner; button re-enables.
			await act(async () => {
				releaseRun();
				await Promise.resolve();
			});
			await waitFor(() => {
				expect(runBtn.hasAttribute('disabled')).toBe(false);
			});
			cleanup();
		});

		it('runner returns {ok: false, error}: button still re-enables, no crash', async () => {
			runImpl = () => Promise.resolve({ ok: false, error: new Error('boom') });
			const { getByRole } = render(
				<StudyLensClient code="x" options={{}} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			const runBtn = getByRole('button', { name: /run/i });
			await act(async () => {
				fireEvent.click(runBtn);
				await Promise.resolve();
			});
			await waitFor(() => {
				expect(runBtn.hasAttribute('disabled')).toBe(false);
			});
			cleanup();
		});
	});

	describe('Format button', () => {
		it('click Format: invokes editor.format() once', async () => {
			const { getByRole } = render(
				<StudyLensClient code="x" options={{}} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			const instance = createdInstances[0]!;
			fireEvent.click(getByRole('button', { name: /format/i }));
			expect(instance.format).toHaveBeenCalledTimes(1);
			cleanup();
		});

		it('Format + Run: Run receives the formatted content', async () => {
			// editor.format() side effect: in production CM mutates its doc
			// to the formatted version. Simulate by having the mock's
			// `format` mutate `content` via the setter.
			const { getByRole } = render(
				<StudyLensClient code="let a=1;" options={{}} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			const instance = createdInstances[0]!;
			(instance.format as unknown as { mockImplementation: (fn: () => void) => void })
				.mockImplementation(() => {
					instance.content = 'let a = 1;';
				});
			fireEvent.click(getByRole('button', { name: /format/i }));
			expect(instance.content).toBe('let a = 1;');
			await act(async () => {
				fireEvent.click(getByRole('button', { name: /run/i }));
			});
			expect(runCalls[0]?.code).toBe('let a = 1;');
			cleanup();
		});
	});

	describe('a11y labels + useId', () => {
		it('each button has a non-empty aria-label', async () => {
			const { getAllByRole } = render(
				<StudyLensClient code="x" options={{}} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			const buttons = getAllByRole('button');
			expect(buttons.length).toBe(3);
			for (const btn of buttons) {
				const label = btn.getAttribute('aria-label');
				expect(label).not.toBeNull();
				expect(label!.length).toBeGreaterThan(0);
			}
		});

		it('toolbar has role="toolbar" with aria-label', async () => {
			const { getByRole } = render(
				<StudyLensClient code="x" options={{}} />,
			);
			const toolbar = getByRole('toolbar');
			expect(toolbar.getAttribute('aria-label')).toBe('Code actions');
		});

		it('two lens instances on the same page have distinct useId values', async () => {
			const { container } = render(
				<>
					<StudyLensClient code="a" options={{}} />
					<StudyLensClient code="b" options={{}} />
				</>,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(2));
			const ids = Array.from(
				container.querySelectorAll('[data-lens-id]'),
			).map((el) => el.getAttribute('data-lens-id'));
			expect(ids).toHaveLength(2);
			expect(ids[0]).not.toBe(ids[1]);
		});
	});

	describe('StudyOptions.buttons visibility filter', () => {
		it('no options.buttons → all three buttons render', async () => {
			const { getAllByRole } = render(
				<StudyLensClient code="x" options={{}} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			expect(getAllByRole('button')).toHaveLength(3);
		});

		it('options.buttons = ["run"] → only Run button in DOM', async () => {
			const { getAllByRole, queryByRole } = render(
				<StudyLensClient code="x" options={{ buttons: ['run'] }} />,
			);
			await waitFor(() => expect(createdInstances).toHaveLength(1));
			expect(getAllByRole('button')).toHaveLength(1);
			expect(queryByRole('button', { name: /run/i })).not.toBeNull();
			expect(queryByRole('button', { name: /format/i })).toBeNull();
			expect(queryByRole('button', { name: /reset/i })).toBeNull();
		});
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
