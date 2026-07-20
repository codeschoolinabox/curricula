// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import Guide from '../index.jsx';

afterEach(cleanup);

function openGuide(container: HTMLElement): void {
	const reveal = container.querySelector<HTMLElement>('[data-guide-reveal]');
	if (!reveal) throw new Error('missing the reveal control');
	fireEvent.click(reveal);
}

describe('Guide', () => {
	describe('collapsed by default (Zero)', () => {
		it('renders the guide root with its data attribute', () => {
			const { container } = render(
				<React.StrictMode>
					<Guide />
				</React.StrictMode>,
			);
			expect(container.querySelector('[data-guide]')).not.toBeNull();
		});

		it('renders no topic entries before the reveal is clicked', () => {
			const { container } = render(
				<React.StrictMode>
					<Guide />
				</React.StrictMode>,
			);
			expect(container.querySelector('[data-guide-topic]')).toBeNull();
		});
	});

	describe('the reveal (One)', () => {
		it('reveals the topic entries on a click', () => {
			const { container } = render(
				<React.StrictMode>
					<Guide />
				</React.StrictMode>,
			);
			openGuide(container);
			expect(container.querySelector('[data-guide-topic]')).not.toBeNull();
		});
	});

	describe('the authored topics (Many)', () => {
		it('renders the topics in the authored array order', () => {
			const { container } = render(
				<React.StrictMode>
					<Guide />
				</React.StrictMode>,
			);
			openGuide(container);
			const keys = Array.from(
				container.querySelectorAll<HTMLElement>('[data-guide-topic]'),
				(entry) => entry.dataset.guideTopic,
			);
			expect(keys).toEqual(['phases', 'levels', 'posture', 'snippet-type']);
		});

		it('heads each entry with a title distinct from its key', () => {
			const { container } = render(
				<React.StrictMode>
					<Guide />
				</React.StrictMode>,
			);
			openGuide(container);
			const titled = Array.from(
				container.querySelectorAll<HTMLElement>('[data-guide-topic]'),
				(entry) =>
					entry.querySelector('h4')?.textContent !== entry.dataset.guideTopic,
			);
			expect(titled).toEqual([true, true, true, true]);
		});

		it('renders body prose beyond each title', () => {
			const { container } = render(
				<React.StrictMode>
					<Guide />
				</React.StrictMode>,
			);
			openGuide(container);
			const bodied = Array.from(
				container.querySelectorAll<HTMLElement>('[data-guide-topic]'),
				(entry) =>
					(entry.textContent?.length ?? 0) >
					(entry.querySelector('h4')?.textContent?.length ?? 0),
			);
			expect(bodied).toEqual([true, true, true, true]);
		});
	});

	describe('closing again (Boundaries)', () => {
		it('hides the entries on a second reveal click', () => {
			const { container } = render(
				<React.StrictMode>
					<Guide />
				</React.StrictMode>,
			);
			openGuide(container);
			openGuide(container);
			expect(container.querySelector('[data-guide-topic]')).toBeNull();
		});
	});

	describe('the disclosure contract (Interfaces)', () => {
		it('reflects the open state on the reveal', () => {
			const { container } = render(
				<React.StrictMode>
					<Guide />
				</React.StrictMode>,
			);
			const reveal = container.querySelector<HTMLElement>(
				'[data-guide-reveal]',
			);
			expect(reveal?.getAttribute('aria-expanded')).toBe('false');
			openGuide(container);
			expect(reveal?.getAttribute('aria-expanded')).toBe('true');
		});

		it('titles every entry at h4', () => {
			const { container } = render(
				<React.StrictMode>
					<Guide />
				</React.StrictMode>,
			);
			openGuide(container);
			expect(container.querySelectorAll('[data-guide] h4')).toHaveLength(4);
		});

		it('renders no heading above h4', () => {
			const { container } = render(
				<React.StrictMode>
					<Guide />
				</React.StrictMode>,
			);
			openGuide(container);
			expect(
				container.querySelector(
					'[data-guide] h1, [data-guide] h2, [data-guide] h3',
				),
			).toBeNull();
		});
	});
});
