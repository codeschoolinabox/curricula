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

		it('reflects the default scaffold toggles (colorize/comments/diff on, suggestions off)', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config()}
				/>,
			);
			const root = container.querySelector('[data-lens="writeme"]');
			expect(root?.getAttribute('data-colorize')).toBe('true');
			expect(root?.getAttribute('data-suggestions')).toBe('false');
			expect(root?.getAttribute('data-comments')).toBe('true');
			expect(root?.getAttribute('data-diff')).toBe('true');
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

		it('reflects scaffold-toggle overrides on the root (triangulates each default)', () => {
			const { container } = render(
				<writemeLens.Component
					embodiment={embody('const x = 1;')}
					config={writemeLens.config({
						colorize: false,
						suggestions: true,
						keepComments: false,
						diff: false,
					})}
				/>,
			);
			const root = container.querySelector('[data-lens="writeme"]');
			expect(root?.getAttribute('data-colorize')).toBe('false');
			expect(root?.getAttribute('data-suggestions')).toBe('true');
			expect(root?.getAttribute('data-comments')).toBe('false');
			expect(root?.getAttribute('data-diff')).toBe('false');
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

	it('renders a read-only solution editor showing the solution in read view', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config({ viewMode: 'read' })}
			/>,
		);
		expect(container.querySelectorAll('[data-writeme-solution]').length).toBe(
			1,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-solution-view] .cm-content')
					?.textContent,
			).toContain('const x = 1;');
		});
		expect(
			container
				.querySelector('[data-writeme-solution-view] .cm-content')
				?.getAttribute('contenteditable'),
		).not.toBe('true');
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

describe('writeme wrapper — scaffold toggles (compartments)', () => {
	it('renders the Assist cluster with colorize and suggestions checkboxes', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		expect(container.querySelector('[data-writeme-assist]')).not.toBeNull();
		expect(
			container
				.querySelector('[data-assist-toggle="colorize"]')
				?.getAttribute('type'),
		).toBe('checkbox');
		expect(
			container
				.querySelector('[data-assist-toggle="suggestions"]')
				?.getAttribute('type'),
		).toBe('checkbox');
	});

	it('checks colorize and leaves suggestions unchecked by default', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		expect(
			(
				container.querySelector(
					'[data-assist-toggle="colorize"]',
				) as HTMLInputElement
			).checked,
		).toBe(true);
		expect(
			(
				container.querySelector(
					'[data-assist-toggle="suggestions"]',
				) as HTMLInputElement
			).checked,
		).toBe(false);
	});

	it('keeps the Assist cluster available in read view', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config({ viewMode: 'read' })}
			/>,
		);
		expect(container.querySelector('[data-writeme-assist]')).not.toBeNull();
		expect(
			container.querySelector('[data-assist-toggle="colorize"]'),
		).not.toBeNull();
	});

	it('toggling colorize flips data-colorize and reconfigures the editor in place (no remount)', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-editor'),
			).not.toBeNull();
		});
		const before = container.querySelector(
			'[data-writeme-editor-host] .cm-editor',
		);
		fireEvent.click(
			container.querySelector('[data-assist-toggle="colorize"]') as Element,
		);
		expect(
			(
				container.querySelector(
					'[data-assist-toggle="colorize"]',
				) as HTMLInputElement
			).checked,
		).toBe(false);
		expect(
			container
				.querySelector('[data-lens="writeme"]')
				?.getAttribute('data-colorize'),
		).toBe('false');
		expect(
			container.querySelector('[data-writeme-editor-host] .cm-editor'),
		).toBe(before);
	});

	it('toggling suggestions flips data-suggestions', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		fireEvent.click(
			container.querySelector('[data-assist-toggle="suggestions"]') as Element,
		);
		expect(
			container
				.querySelector('[data-lens="writeme"]')
				?.getAttribute('data-suggestions'),
		).toBe('true');
	});

	it('toggling suggestions reconfigures the editor in place (no remount)', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-editor'),
			).not.toBeNull();
		});
		const before = container.querySelector(
			'[data-writeme-editor-host] .cm-editor',
		);
		fireEvent.click(
			container.querySelector('[data-assist-toggle="suggestions"]') as Element,
		);
		expect(
			container.querySelector('[data-writeme-editor-host] .cm-editor'),
		).toBe(before);
	});

	it('keeps the read editor and its solution across a colorize toggle in read view', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('const x = 1;')}
				config={writemeLens.config({ viewMode: 'read' })}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-solution-view] .cm-content')
					?.textContent,
			).toContain('const x = 1;');
		});
		fireEvent.click(
			container.querySelector('[data-assist-toggle="colorize"]') as Element,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-solution-view] .cm-content')
					?.textContent,
			).toContain('const x = 1;');
		});
	});
});

describe('writeme wrapper — comments toggle + reset (6c-rb)', () => {
	it('renders the comments checkbox (checked by default) and a Reset button', () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('// hi\nconst x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		const comments = container.querySelector(
			'[data-assist-toggle="comments"]',
		) as HTMLInputElement | null;
		expect(comments).not.toBeNull();
		expect(comments?.checked).toBe(true);
		expect(container.querySelector('[data-reset]')).not.toBeNull();
	});

	it('toggling comments off re-seeds the pristine editor to a blank slate', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('// hi\nconst x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-content')
					?.textContent,
			).toContain('// hi');
		});
		fireEvent.click(
			container.querySelector('[data-assist-toggle="comments"]') as Element,
		);
		await waitFor(() => {
			const text = container.querySelector(
				'[data-writeme-editor-host] .cm-content',
			)?.textContent;
			expect(text).not.toContain('// hi');
			expect(text).not.toContain('const x = 1;');
		});
		expect(
			container
				.querySelector('[data-lens="writeme"]')
				?.getAttribute('data-comments'),
		).toBe('false');
	});

	it('toggling comments on re-seeds the pristine editor to the comment skeleton', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('// hi\nconst x = 1;')}
				config={writemeLens.config({ keepComments: false })}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-editor'),
			).not.toBeNull();
		});
		fireEvent.click(
			container.querySelector('[data-assist-toggle="comments"]') as Element,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-content')
					?.textContent,
			).toContain('// hi');
		});
	});

	it('re-seeds in place on a comments toggle (no remount)', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('// hi\nconst x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-editor'),
			).not.toBeNull();
		});
		const before = container.querySelector(
			'[data-writeme-editor-host] .cm-editor',
		);
		fireEvent.click(
			container.querySelector('[data-assist-toggle="comments"]') as Element,
		);
		expect(
			container
				.querySelector('[data-lens="writeme"]')
				?.getAttribute('data-comments'),
		).toBe('false');
		expect(
			container.querySelector('[data-writeme-editor-host] .cm-editor'),
		).toBe(before);
	});

	it('shows no "Reset to apply" hint after a pristine comments toggle', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('// hi\nconst x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-editor'),
			).not.toBeNull();
		});
		// Never rendered on a pristine editor — nothing was clobbered.
		expect(container.querySelector('[data-writeme-reseed-pending]')).toBeNull();
		fireEvent.click(
			container.querySelector('[data-assist-toggle="comments"]') as Element,
		);
		await waitFor(() => {
			expect(
				container
					.querySelector('[data-lens="writeme"]')
					?.getAttribute('data-comments'),
			).toBe('false');
		});
		// Still absent: a pristine re-seed keeps appliedKeepComments aligned.
		expect(container.querySelector('[data-writeme-reseed-pending]')).toBeNull();
	});

	it('Reset re-seeds to the comment skeleton when keepComments is on', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('// hi\nconst x = 1;')}
				config={writemeLens.config()}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-editor'),
			).not.toBeNull();
		});
		fireEvent.click(container.querySelector('[data-reset]') as Element);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-content')
					?.textContent,
			).toContain('// hi');
		});
	});

	it('Reset re-seeds to a blank slate when keepComments is off', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('// hi\nconst x = 1;')}
				config={writemeLens.config({ keepComments: false })}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-editor'),
			).not.toBeNull();
		});
		fireEvent.click(container.querySelector('[data-reset]') as Element);
		await waitFor(() => {
			const text = container.querySelector(
				'[data-writeme-editor-host] .cm-content',
			)?.textContent;
			expect(text).not.toContain('// hi');
			expect(text).not.toContain('const x = 1;');
		});
	});

	it('toggling comments off blanks a comment-only snippet (boundary)', async () => {
		const { container } = render(
			<writemeLens.Component
				embodiment={embody('// only a comment')}
				config={writemeLens.config()}
			/>,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-content')
					?.textContent,
			).toContain('// only');
		});
		fireEvent.click(
			container.querySelector('[data-assist-toggle="comments"]') as Element,
		);
		await waitFor(() => {
			expect(
				container.querySelector('[data-writeme-editor-host] .cm-content')
					?.textContent,
			).not.toContain('// only');
		});
	});
});

describe.skip('comments + reset — diverged-editor behavior (browser gate; jsdom cannot type into CodeMirror)', () => {
	it.todo(
		'toggling comments while the learner has typed divergent code does NOT clobber it',
	);
	it.todo(
		'a comments toggle on a diverged editor surfaces the "Reset to apply" affordance',
	);
	it.todo(
		'Reset restores the starting template after the learner has diverged',
	);
});
