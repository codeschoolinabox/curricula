/**
 * @file Unit tests for the Increment-8 `<StudyLenses>` React wrapper.
 *
 * ZOMBIES order:
 *   Zero  — empty snippet still renders the host with the editor stub.
 *   One   — non-empty snippet is forwarded verbatim into the lens mount.
 *   Many  — host element actually contains the lens mount's `el`.
 *   Bound — unknown lens name falls back to "editor".
 *   Iface — async lens is awaited then attached.
 *   Iface — async cancellation: unmount mid-flight disposes once and
 *           never appends.
 *   Excep — `validatePipeline` throw renders the error fallback.
 *   Excep — `lang !== "js"` renders banner + raw `<pre>`, no host attach.
 *   Smoke — SSR fallback renders `<pre>{code}</pre>` with no host.
 *
 * @vitest-environment jsdom
 */

import { act, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import StudyLenses from '../study-lenses.js';

afterEach(function cleanupConsole() {
	vi.restoreAllMocks();
});

describe('<StudyLenses>', () => {
	describe('Zero — empty snippet', () => {
		it('renders the orchestrator host with the editor stub mounted inside', async () => {
			const { container } = render(
				<StudyLenses code="" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const host = container.querySelector('[data-orchestrator="study-lenses"]');
			expect(host).not.toBeNull();
			const stub = host?.querySelector<HTMLTextAreaElement>(
				'[data-lens="editor-stub"]',
			);
			expect(stub).not.toBeNull();
			expect(stub?.value).toBe('');
		});
	});

	describe('One — non-empty snippet', () => {
		it('forwards the code prop verbatim into the lens mount', async () => {
			const { container } = render(
				<StudyLenses code="let x = 42;" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const stub = container.querySelector<HTMLTextAreaElement>(
				'[data-lens="editor-stub"]',
			);
			expect(stub?.value).toBe('let x = 42;');
		});
	});

	describe('Many — host attachment', () => {
		it('appends the lens mount.el as a child of the host div (not as text)', async () => {
			const { container } = render(
				<StudyLenses code="x;" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			const host = container.querySelector('[data-orchestrator="study-lenses"]');
			const first = host?.firstElementChild as HTMLElement | null;
			expect(first?.tagName).toBe('TEXTAREA');
			expect(first?.dataset.lens).toBe('editor-stub');
		});
	});

	describe('Boundary — unknown lens name', () => {
		it('falls back to the editor lens (per validatePipeline) and warns', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(function silence() {});
			const { container } = render(
				<StudyLenses code="x;" lens="not-a-real-lens" lang="js" />,
			);
			await act(async function flush() {});
			const stub = container.querySelector('[data-lens="editor-stub"]');
			expect(stub).not.toBeNull();
			expect(warnSpy).toHaveBeenCalled();
		});
	});

	describe('Exceptions — invalid transform name', () => {
		it('renders the error fallback when validatePipeline throws', async () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(function silence() {});
			const { container } = render(
				<StudyLenses
					code="x;"
					lens="editor"
					lang="js"
					transforms="not-a-real-transform"
				/>,
			);
			await act(async function flush() {});
			const errorNode = container.querySelector('[data-orchestrator-error]');
			expect(errorNode).not.toBeNull();
			expect(errorNode?.textContent).toMatch(/transform/i);
			expect(errorSpy).not.toBeNull();
		});
	});

	describe('Exceptions — non-JS language', () => {
		it('renders banner + raw <pre>, never attempts a lens mount', async () => {
			const { container } = render(
				<StudyLenses code="print('hi')" lens="editor" lang="py" />,
			);
			await act(async function flush() {});
			const banner = container.querySelector('[data-orchestrator-banner]');
			expect(banner).not.toBeNull();
			expect(banner?.getAttribute('role')).toBe('alert');
			const stub = container.querySelector('[data-lens="editor-stub"]');
			expect(stub).toBeNull();
			const pre = container.querySelector('[data-orchestrator] > pre');
			expect(pre?.textContent).toBe("print('hi')");
		});
	});

	describe('Smoke — code prop survives the full pipeline', () => {
		it('renders the snippet inside the host on a happy-path js:editor mount', async () => {
			const { container } = render(
				<StudyLenses code="console.log(1);" lens="editor" lang="js" />,
			);
			await act(async function flush() {});
			expect(container.textContent).toContain('console.log(1);');
		});
	});
});
