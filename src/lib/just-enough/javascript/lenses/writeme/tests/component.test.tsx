/**
 * @vitest-environment jsdom
 *
 * Component (wiring) tests for the `writeme` React wrapper. jsdom does NOT
 * implement real CodeMirror interaction (typing, paste events, contenteditable
 * selection) — these prove the wrapper MOUNTS, seeds its editor, and exposes its
 * data-* contract; real paste-blocking / diff / typing behavior is verified at
 * the browser checkpoint, not here.
 */

import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import writemeLens from '../index.js';

afterEach(cleanup);

describe('writeme wrapper — Inc 6a (mount)', () => {
	describe('Zero — degenerate snippets do not crash', () => {
		it('renders without throwing on an empty snippet', () => {
			expect(() =>
				render(
					<writemeLens.Component
						embodiment={embody('')}
						config={writemeLens.config()}
					/>,
				),
			).not.toThrow();
		});

		it('renders without throwing on an unparseable snippet', () => {
			expect(() =>
				render(
					<writemeLens.Component
						embodiment={embody('FAIL_AT_PARSE')}
						config={writemeLens.config()}
					/>,
				),
			).not.toThrow();
		});

		it('renders the lens root even on an unparseable snippet (Tier 1: no fallback)', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('FAIL_AT_PARSE')}
					config={writemeLens.config()}
				/>,
			);
			expect(container.querySelector('[data-lens="writeme"]')).not.toBeNull();
		});
	});

	describe('One — mounts the write editor under the lens root', () => {
		it('renders the data-lens="writeme" root', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config()}
				/>,
			);
			expect(container.querySelector('[data-lens="writeme"]')).not.toBeNull();
		});

		it('renders the CodeMirror editor host', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config()}
				/>,
			);
			expect(
				container.querySelector('[data-writeme-editor-host]'),
			).not.toBeNull();
		});

		it('instantiates a CodeMirror editor instance in the host', async () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-editor')).not.toBeNull();
			});
		});
	});

	describe('Root reflects the committed config defaults', () => {
		it('reflects the default view mode (write)', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config()}
				/>,
			);
			expect(
				container
					.querySelector('[data-lens="writeme"]')
					?.getAttribute('data-view-mode'),
			).toBe('write');
		});

		it('reflects the default editor mode (diff)', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config()}
				/>,
			);
			expect(
				container
					.querySelector('[data-lens="writeme"]')
					?.getAttribute('data-editor-mode'),
			).toBe('diff');
		});

		it('reflects the default hints mode (on)', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config()}
				/>,
			);
			expect(
				container
					.querySelector('[data-lens="writeme"]')
					?.getAttribute('data-hints-mode'),
			).toBe('on');
		});

		it('reflects an editorMode override on the root (triangulates the diff default)', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config({ editorMode: 'raw' })}
				/>,
			);
			expect(
				container
					.querySelector('[data-lens="writeme"]')
					?.getAttribute('data-editor-mode'),
			).toBe('raw');
		});

		it('reflects a viewMode override on the root (triangulates the write default)', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config({ viewMode: 'read' })}
				/>,
			);
			expect(
				container
					.querySelector('[data-lens="writeme"]')
					?.getAttribute('data-view-mode'),
			).toBe('read');
		});

		it('reflects a hintsMode override on the root (triangulates the on default)', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config({ hintsMode: 'off' })}
				/>,
			);
			expect(
				container
					.querySelector('[data-lens="writeme"]')
					?.getAttribute('data-hints-mode'),
			).toBe('off');
		});
	});

	describe('Editor is seeded from the comment skeleton (synchronous, no flicker)', () => {
		it('keeps the comment line in the seeded editor (keepComments default)', async () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('// hello\nconst x = 1;')}
					config={writemeLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(container.querySelector('.cm-content')?.textContent).toContain(
					'// hello',
				);
			});
		});

		it('strips the code line from the seeded editor (keepComments default)', async () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('// hello\nconst x = 1;')}
					config={writemeLens.config()}
				/>,
			);
			await waitFor(() => {
				expect(
					container.querySelector('.cm-content')?.textContent,
				).not.toContain('const x = 1;');
			});
		});

		it('seeds a blank editor when keepComments is off', async () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config({ keepComments: false })}
				/>,
			);
			await waitFor(() => {
				expect(
					container.querySelector('.cm-content')?.textContent,
				).not.toContain('const x = 1;');
			});
		});
	});
});
