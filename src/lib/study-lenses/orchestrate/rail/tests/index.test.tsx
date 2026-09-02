// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Caption, Station } from '../../types.js';
import Rail from '../index.jsx';

afterEach(cleanup);

function fiveStations(): ReadonlyArray<Station> {
	return [
		{
			phase: 'source',
			standing: 'openable',
			tray: [
				{ lens: 'parsons', label: 'rebuild the order' },
				{ lens: 'writeme', label: 'write it from memory' },
			],
		},
		{ phase: 'tokens', standing: 'bare' },
		{ phase: 'ast', standing: 'bare' },
		{ phase: 'environment', standing: 'bare' },
		{ phase: 'evaluation', standing: 'bare' },
	];
}

function barredStations(): ReadonlyArray<Station> {
	return fiveStations().map((station, index) =>
		index >= 3 ? { phase: station.phase, standing: 'waiting' } : station,
	);
}

const COUNT_CAPTION: Caption = { holds: 'count', empty: 4 };
const CAUSE_CAPTION: Caption = {
	holds: 'cause',
	cause: { stage: 'ast', message: 'Unexpected token (2:8).' },
	unreached: 2,
};

describe.skip('Rail', () => {
	describe('the line itself (Zero)', () => {
		it('renders the rail root', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(container.querySelectorAll('[data-rail]')).toHaveLength(1);
		});

		it('renders no heading elements', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(
				0,
			);
		});
	});

	describe('one station per given station (One)', () => {
		it('draws them in the given order', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(
				Array.from(
					container.querySelectorAll<HTMLElement>('[data-station]'),
				).map((node) => node.dataset.station),
			).toEqual(['source', 'tokens', 'ast', 'environment', 'evaluation']);
		});

		it('draws each station s standing', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(
				Array.from(
					container.querySelectorAll<HTMLElement>('[data-station-standing]'),
				).map((node) => node.dataset.stationStanding),
			).toEqual(['openable', 'bare', 'bare', 'bare', 'bare']);
		});
	});

	describe('the vocabulary it draws (Many)', () => {
		it('draws the phase short label, keyed rather than carried', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(
				container.querySelector('[data-station="tokens"]')?.textContent,
			).toContain('Tokens');
		});

		it('never draws a phase s data name', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(container.querySelector('[data-rail]')?.textContent).not.toContain(
				'evaluation',
			);
		});
	});

	describe('the edge and the caption (Boundaries)', () => {
		it('draws one barring edge however many phases wait', () => {
			const { container } = render(
				<Rail
					stations={barredStations()}
					caption={CAUSE_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(container.querySelectorAll('[data-barring-edge]')).toHaveLength(1);
		});

		it('draws the cause once rather than once per waiting station', () => {
			const { container } = render(
				<Rail
					stations={barredStations()}
					caption={CAUSE_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(container.querySelectorAll('[data-caption-cause]')).toHaveLength(
				1,
			);
		});

		it('renders the caption after the line in document order', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			const rail = container.querySelector('[data-rail]');
			const caption = container.querySelector('[data-caption]');
			expect(
				rail &&
					caption &&
					rail.compareDocumentPosition(caption) &
						Node.DOCUMENT_POSITION_FOLLOWING,
			).toBeTruthy();
		});

		it('renders no caption arm at all when the caption holds nothing', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={{ holds: 'nothing' }}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(
				container.querySelectorAll(
					'[data-caption-count], [data-caption-cause]',
				),
			).toHaveLength(0);
		});
	});

	describe('what a station offers (Interfaces)', () => {
		it('a bare station renders no disclosure control', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(
				container.querySelector('[data-station="tokens"] button'),
			).toBeNull();
		});

		it('marks the station whose lens the pane holds', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName="parsons"
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(
				Array.from(
					container.querySelectorAll<HTMLElement>('[data-station-occupant]'),
				).map(
					(node) =>
						node.closest<HTMLElement>('[data-station]')?.dataset.station,
				),
			).toEqual(['source']);
		});

		it('marks no station when the pane names no lens', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(
				container.querySelectorAll('[data-station-occupant]'),
			).toHaveLength(0);
		});

		it('raises one intent carrying the phase and the lens', () => {
			const onTrayEntry = vi.fn();
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={onTrayEntry}
				/>,
			);
			const entry = container.querySelector(
				'[data-station="source"] [data-tray-entry="parsons"]',
			);
			if (entry) {
				fireEvent.click(entry);
			}
			expect(onTrayEntry).toHaveBeenCalledWith({
				phase: 'source',
				lens: 'parsons',
			});
		});

		it('raises the same intent for the open lens s own tray entry', () => {
			const onTrayEntry = vi.fn();
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName="parsons"
					onTrayEntry={onTrayEntry}
				/>,
			);
			const entry = container.querySelector(
				'[data-station="source"] [data-tray-entry="parsons"]',
			);
			if (entry) {
				fireEvent.click(entry);
			}
			expect(onTrayEntry).toHaveBeenCalledWith({
				phase: 'source',
				lens: 'parsons',
			});
		});
	});

	describe('the spoken surface (Exceptions)', () => {
		it('each bare station carries its own visually-hidden reason', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			expect(container.querySelectorAll('[data-station-reason]')).toHaveLength(
				4,
			);
		});
	});

	describe('the tray s geometry (Simple)', () => {
		it('an open tray renders between the line and the caption', () => {
			const { container } = render(
				<Rail
					stations={fiveStations()}
					caption={COUNT_CAPTION}
					openLensName={null}
					onTrayEntry={vi.fn()}
				/>,
			);
			const control = container.querySelector(
				'[data-station="source"] [data-station-tray-control]',
			);
			if (control) {
				fireEvent.click(control);
			}
			const tray = container.querySelector('[data-station-tray]');
			const caption = container.querySelector('[data-caption]');
			expect(
				tray &&
					caption &&
					tray.compareDocumentPosition(caption) &
						Node.DOCUMENT_POSITION_FOLLOWING,
			).toBeTruthy();
		});
	});
});
