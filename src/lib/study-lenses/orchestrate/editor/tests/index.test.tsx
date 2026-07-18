// @vitest-environment jsdom

import { EditorView } from '@codemirror/view';
import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Editor from '../index.jsx';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

async function findMountedEditorView(
	container: HTMLElement,
): Promise<EditorView> {
	const content = await waitFor(() => {
		const editors = container.querySelectorAll<HTMLElement>('.cm-editor');
		if (editors.length !== 1)
			throw new Error(`expected exactly one editor, saw ${editors.length}`);
		const element = editors[0]?.querySelector<HTMLElement>('.cm-content');
		if (!element) throw new Error('CodeMirror content not yet mounted');
		return element;
	});
	const view = EditorView.findFromDOM(content);
	if (!view) throw new Error('EditorView.findFromDOM returned null');
	return view;
}

describe('Editor', () => {
	describe('mounting under StrictMode (Zero)', () => {
		it('renders the host with its data attribute before mount resolves', () => {
			const { container } = render(
				<React.StrictMode>
					<Editor onEdit={vi.fn()} snippet="" />
				</React.StrictMode>,
			);
			expect(container.querySelector('[data-editor-host]')).not.toBeNull();
		});

		it('mounts exactly one live editor', async () => {
			const { container } = render(
				<React.StrictMode>
					<Editor onEdit={vi.fn()} snippet="" />
				</React.StrictMode>,
			);
			await findMountedEditorView(container);
			expect(container.querySelectorAll('.cm-editor')).toHaveLength(1);
		});

		it('destroys the superseded StrictMode mount', async () => {
			const destroySpy = vi.spyOn(EditorView.prototype, 'destroy');
			const { container } = render(
				<React.StrictMode>
					<Editor onEdit={vi.fn()} snippet="" />
				</React.StrictMode>,
			);
			await findMountedEditorView(container);
			await waitFor(() => {
				expect(destroySpy).toHaveBeenCalledTimes(1);
			});
		});

		it('never fires onEdit across mount and unmount', async () => {
			const onEdit = vi.fn();
			const { container, unmount } = render(
				<React.StrictMode>
					<Editor onEdit={onEdit} snippet="" />
				</React.StrictMode>,
			);
			await findMountedEditorView(container);
			unmount();
			expect(onEdit).not.toHaveBeenCalled();
		});
	});

	describe('the seed snippet (One)', () => {
		it('appears in the mounted document', async () => {
			const { container } = render(
				<React.StrictMode>
					<Editor onEdit={vi.fn()} snippet="let x = 1;" />
				</React.StrictMode>,
			);
			const view = await findMountedEditorView(container);
			expect(view.state.doc.toString()).toBe('let x = 1;');
		});
	});

	describe('the edit relay through the surface (One)', () => {
		it('fires onEdit once with the new source', async () => {
			const onEdit = vi.fn();
			const { container } = render(
				<React.StrictMode>
					<Editor onEdit={onEdit} snippet="seed" />
				</React.StrictMode>,
			);
			const view = await findMountedEditorView(container);
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: 'edited' },
			});
			expect(onEdit.mock.calls).toEqual([['edited']]);
		});
	});

	describe('a snippet change during the in-flight mount (Boundaries)', () => {
		it('writes the latest snippet once mounted', async () => {
			const onEdit = vi.fn();
			const { container, rerender } = render(
				<React.StrictMode>
					<Editor onEdit={onEdit} snippet="v1" />
				</React.StrictMode>,
			);
			rerender(
				<React.StrictMode>
					<Editor onEdit={onEdit} snippet="v2" />
				</React.StrictMode>,
			);
			const view = await findMountedEditorView(container);
			await waitFor(() => {
				expect(view.state.doc.toString()).toBe('v2');
			});
		});
	});

	describe('a snippet change after mount (Boundaries)', () => {
		it('writes into the live document', async () => {
			const onEdit = vi.fn();
			const { container, rerender } = render(
				<React.StrictMode>
					<Editor onEdit={onEdit} snippet="before" />
				</React.StrictMode>,
			);
			const view = await findMountedEditorView(container);
			rerender(
				<React.StrictMode>
					<Editor onEdit={onEdit} snippet="after" />
				</React.StrictMode>,
			);
			await waitFor(() => {
				expect(view.state.doc.toString()).toBe('after');
			});
		});

		it('never echoes an edit event', async () => {
			const onEdit = vi.fn();
			const { container, rerender } = render(
				<React.StrictMode>
					<Editor onEdit={onEdit} snippet="before" />
				</React.StrictMode>,
			);
			const view = await findMountedEditorView(container);
			rerender(
				<React.StrictMode>
					<Editor onEdit={onEdit} snippet="after" />
				</React.StrictMode>,
			);
			await waitFor(() => {
				expect(view.state.doc.toString()).toBe('after');
			});
			expect(onEdit).not.toHaveBeenCalled();
		});
	});

	describe('unmount (Cleanup)', () => {
		it('leaves no editor in the container', async () => {
			const { container, unmount } = render(
				<React.StrictMode>
					<Editor onEdit={vi.fn()} snippet="" />
				</React.StrictMode>,
			);
			await findMountedEditorView(container);
			unmount();
			expect(container.querySelector('.cm-editor')).toBeNull();
		});
	});

	describe('a rejecting factory (Exceptions)', () => {
		it('renders the fallback carrying both data attributes', async () => {
			vi.resetModules();
			vi.doMock('../lib/create-editor.js', () => ({
				default: vi.fn().mockRejectedValue(new Error('construction failed')),
			}));
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				const { default: MockedEditor } = await import('../index.jsx');
				const { container } = render(
					<React.StrictMode>
						<MockedEditor onEdit={vi.fn()} snippet="" />
					</React.StrictMode>,
				);
				await waitFor(() => {
					expect(
						container.querySelector('[data-editor-host][data-editor-error]'),
					).not.toBeNull();
				});
			} finally {
				warnSpy.mockRestore();
				vi.doUnmock('../lib/create-editor.js');
				vi.resetModules();
			}
		});

		it('warns with the rejection', async () => {
			vi.resetModules();
			vi.doMock('../lib/create-editor.js', () => ({
				default: vi.fn().mockRejectedValue(new Error('construction failed')),
			}));
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				const { default: MockedEditor } = await import('../index.jsx');
				render(
					<React.StrictMode>
						<MockedEditor onEdit={vi.fn()} snippet="" />
					</React.StrictMode>,
				);
				await waitFor(() => {
					expect(warnSpy).toHaveBeenCalled();
				});
			} finally {
				warnSpy.mockRestore();
				vi.doUnmock('../lib/create-editor.js');
				vi.resetModules();
			}
		});
	});
});
