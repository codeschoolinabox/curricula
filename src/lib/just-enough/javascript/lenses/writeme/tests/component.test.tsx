/**
 * @vitest-environment jsdom
 *
 * Component (wiring) tests for the `writeme` React wrapper. jsdom does NOT
 * implement real CodeMirror interaction (typing, paste events, contenteditable
 * selection) — these prove the wrapper MOUNTS, seeds its editor, and exposes its
 * data-* contract; real paste-blocking / diff / typing behavior is verified at
 * the browser checkpoint, not here.
 */

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
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

describe('writeme wrapper — Inc 6b (view toggle + read view)', () => {
	it('renders a view toolbar exposing write and read toggles', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		expect(container.querySelector('[data-writeme-toolbar]')).not.toBeNull();
		expect(
			container.querySelector('[data-view-toggle="write"]'),
		).not.toBeNull();
		expect(container.querySelector('[data-view-toggle="read"]')).not.toBeNull();
	});

	it('marks the write toggle pressed and the read toggle unpressed by default', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		expect(
			container
				.querySelector('[data-view-toggle="write"]')
				?.getAttribute('aria-pressed'),
		).toBe('true');
		expect(
			container
				.querySelector('[data-view-toggle="read"]')
				?.getAttribute('aria-pressed'),
		).toBe('false');
	});

	it('flips the root to data-view-mode="read" when the read toggle is clicked', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		fireEvent.click(
			container.querySelector('[data-view-toggle="read"]') as Element,
		);
		expect(
			container
				.querySelector('[data-lens="writeme"]')
				?.getAttribute('data-view-mode'),
		).toBe('read');
	});

	it('renders the solution study panel only in read view', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		expect(container.querySelector('[data-writeme-solution-view]')).toBeNull();
		fireEvent.click(
			container.querySelector('[data-view-toggle="read"]') as Element,
		);
		expect(
			container.querySelector('[data-writeme-solution-view]'),
		).not.toBeNull();
	});

	it('shows the solution exactly once in read view, with no editor and no learner panel', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config({ viewMode: 'read' })}
			/>,
		);
		const solutions = container.querySelectorAll('[data-writeme-solution]');
		expect(solutions.length).toBe(1);
		expect(solutions[0]?.textContent).toContain('const x = 1;');
		expect(
			container.querySelectorAll('[data-writeme-solution-view] .cm-editor')
				.length,
		).toBe(0);
		expect(
			container.querySelectorAll('[data-writeme-solution-view] pre').length,
		).toBe(1);
	});

	it('does not render the solution panel in write view', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		expect(container.querySelector('[data-writeme-solution]')).toBeNull();
	});

	it('keeps the editor host mounted across a write to read to write toggle', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		fireEvent.click(
			container.querySelector('[data-view-toggle="read"]') as Element,
		);
		expect(
			container.querySelector('[data-writeme-editor-host]'),
		).not.toBeNull();
		fireEvent.click(
			container.querySelector('[data-view-toggle="write"]') as Element,
		);
		expect(
			container.querySelector('[data-writeme-editor-host]'),
		).not.toBeNull();
	});

	it('hides the editor host in read view and restores it in write view', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		expect(
			container
				.querySelector('[data-writeme-editor-host]')
				?.hasAttribute('hidden'),
		).toBe(false);
		fireEvent.click(
			container.querySelector('[data-view-toggle="read"]') as Element,
		);
		expect(
			container
				.querySelector('[data-writeme-editor-host]')
				?.hasAttribute('hidden'),
		).toBe(true);
		fireEvent.click(
			container.querySelector('[data-view-toggle="write"]') as Element,
		);
		expect(
			container
				.querySelector('[data-writeme-editor-host]')
				?.hasAttribute('hidden'),
		).toBe(false);
		expect(
			container
				.querySelector('[data-lens="writeme"]')
				?.getAttribute('data-view-mode'),
		).toBe('write');
	});

	it('inverts aria-pressed on both toggles across read then write', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		fireEvent.click(
			container.querySelector('[data-view-toggle="read"]') as Element,
		);
		expect(
			container
				.querySelector('[data-view-toggle="write"]')
				?.getAttribute('aria-pressed'),
		).toBe('false');
		expect(
			container
				.querySelector('[data-view-toggle="read"]')
				?.getAttribute('aria-pressed'),
		).toBe('true');
		fireEvent.click(
			container.querySelector('[data-view-toggle="write"]') as Element,
		);
		expect(
			container
				.querySelector('[data-view-toggle="write"]')
				?.getAttribute('aria-pressed'),
		).toBe('true');
		expect(
			container
				.querySelector('[data-view-toggle="read"]')
				?.getAttribute('aria-pressed'),
		).toBe('false');
	});

	it('renders the read-view solution panel for an empty snippet without crashing', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('')}
				config={writemeLens.config({ viewMode: 'read' })}
			/>,
		);
		expect(
			container.querySelector('[data-writeme-solution-view]'),
		).not.toBeNull();
		expect(container.querySelector('[data-writeme-solution]')).not.toBeNull();
	});
});
