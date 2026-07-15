// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import EmbeddedGuide from '../index.jsx';

afterEach(cleanup);

describe('EmbeddedGuide', () => {
	describe('Zero — the guide root and collapsed state', () => {
		it('renders the guide root', () => {
			const { container } = render(
				<EmbeddedGuide revealed={false} onToggle={() => {}} />,
			);
			expect(
				container.querySelector('[data-orchestrator-guide]'),
			).not.toBeNull();
		});

		it('labels the reveal affordance for assistive technology', () => {
			const { container } = render(
				<EmbeddedGuide revealed={false} onToggle={() => {}} />,
			);
			expect(
				container
					.querySelector('[data-orchestrator-guide] button')
					?.getAttribute('aria-label'),
			).toBeTruthy();
		});

		// Guard: green even against the stub (no content div yet); it pairs with
		// "shows … when revealed" to kill the always-shown fake once content exists.
		it('hides the authored content when not revealed', () => {
			const { container } = render(
				<EmbeddedGuide revealed={false} onToggle={() => {}} />,
			);
			expect(
				container.querySelector('[data-orchestrator-guide-content]'),
			).toBeNull();
		});
	});

	describe('One — the revealed state', () => {
		it('shows the authored content when revealed', () => {
			const { container } = render(
				<EmbeddedGuide revealed={true} onToggle={() => {}} />,
			);
			expect(
				container.querySelector('[data-orchestrator-guide-content]'),
			).not.toBeNull();
		});
	});

	describe('Simple — the authored instrument topics', () => {
		// The five topics are the guide's locked SPECIFICATION (canonical spec +
		// DOCS Mermaid): stations, reveal rules, toggles, limits, danger. Pinning
		// each by data-attr value (never prose) catches an implementation that
		// ships only a subset.
		it('covers all five canonical instrument topics when revealed', () => {
			const { container } = render(
				<EmbeddedGuide revealed={true} onToggle={() => {}} />,
			);
			for (const topic of [
				'stations',
				'reveal-rules',
				'toggles',
				'limits',
				'danger',
			]) {
				expect(
					container.querySelector(`[data-orchestrator-guide-topic="${topic}"]`),
				).not.toBeNull();
			}
		});
	});

	describe('Interface — routing the reveal click', () => {
		it('routes a reveal-affordance click up through onToggle once', () => {
			const onToggle = vi.fn();
			const { container } = render(
				<EmbeddedGuide revealed={false} onToggle={onToggle} />,
			);
			fireEvent.click(
				container.querySelector(
					'[data-orchestrator-guide] button[aria-label]',
				)!,
			);
			expect(onToggle).toHaveBeenCalledTimes(1);
		});
	});
});
