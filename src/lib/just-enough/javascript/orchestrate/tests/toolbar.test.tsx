// @vitest-environment jsdom

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import Toolbar from '../toolbar.js';

describe('<Toolbar>', () => {
	describe('Zero — empty shell', () => {
		it('renders an element matching [data-orchestrator-toolbar]', () => {
			const { container } = render(
				<Toolbar
					lensNames={[]}
					pickerValue=""
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-toolbar]'),
			).not.toBeNull();
		});

		it('the toolbar element is a <nav>', () => {
			const { container } = render(
				<Toolbar
					lensNames={[]}
					pickerValue=""
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const toolbar = container.querySelector('[data-orchestrator-toolbar]');
			expect(toolbar?.tagName).toBe('NAV');
		});

		it('the picker holds the sentinel even with an empty lensNames array', () => {
			const { container } = render(
				<Toolbar
					lensNames={[]}
					pickerValue=""
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const options = container.querySelectorAll(
				'[data-orchestrator-lens-picker] option',
			);
			expect(options.length).toBe(1);
		});
	});

	describe('Many — one <option> per registered lens', () => {
		it('the toolbar contains a <select data-orchestrator-lens-picker>', () => {
			const { container } = render(
				<Toolbar
					lensNames={['a', 'b', 'c']}
					pickerValue=""
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-lens-picker]'),
			).not.toBeNull();
		});

		it('the picker element is a <select>', () => {
			const { container } = render(
				<Toolbar
					lensNames={['a', 'b', 'c']}
					pickerValue=""
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const picker = container.querySelector('[data-orchestrator-lens-picker]');
			expect(picker?.tagName).toBe('SELECT');
		});

		it('the picker carries an aria-label so it has an accessible name', () => {
			const { container } = render(
				<Toolbar
					lensNames={['a', 'b', 'c']}
					pickerValue=""
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const picker = container.querySelector('[data-orchestrator-lens-picker]');
			expect(picker?.getAttribute('aria-label')).toBe('Lens picker');
		});

		it('the first <option> is a disabled sentinel with value=""', () => {
			const { container } = render(
				<Toolbar
					lensNames={['a', 'b', 'c']}
					pickerValue=""
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const firstOption = container.querySelector(
				'[data-orchestrator-lens-picker] option',
			) as HTMLOptionElement | null;
			expect({
				value: firstOption?.value,
				disabled: firstOption?.disabled,
			}).toEqual({ value: '', disabled: true });
		});

		it('the lens <option>s follow the sentinel, in input order, with matching value and label', () => {
			const { container } = render(
				<Toolbar
					lensNames={['a', 'b', 'c']}
					pickerValue=""
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const options = container.querySelectorAll(
				'[data-orchestrator-lens-picker] option',
			);
			const entries = Array.from(options)
				.slice(1)
				.map((option) => ({
					value: (option as HTMLOptionElement).value,
					label: option.textContent,
				}));
			expect(entries).toEqual([
				{ value: 'a', label: 'a' },
				{ value: 'b', label: 'b' },
				{ value: 'c', label: 'c' },
			]);
		});
	});

	describe('Controlled value — pickerValue prop governs selection', () => {
		it('pickerValue="" yields picker.value === ""', () => {
			const { container } = render(
				<Toolbar
					lensNames={['a', 'b']}
					pickerValue=""
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const picker = container.querySelector(
				'[data-orchestrator-lens-picker]',
			) as HTMLSelectElement;
			expect(picker.value).toBe('');
		});

		it('pickerValue="a" yields picker.value === "a"', () => {
			const { container } = render(
				<Toolbar
					lensNames={['a', 'b']}
					pickerValue="a"
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const picker = container.querySelector(
				'[data-orchestrator-lens-picker]',
			) as HTMLSelectElement;
			expect(picker.value).toBe('a');
		});
	});

	describe('onLensSelect — invoked with the chosen lens name, sentinel filtered', () => {
		it('firing a change event with a registered lens name calls onLensSelect with that name', () => {
			const onLensSelect = vi.fn();
			const { container } = render(
				<Toolbar
					lensNames={['a', 'b']}
					pickerValue=""
					onLensSelect={onLensSelect}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			const picker = container.querySelector(
				'[data-orchestrator-lens-picker]',
			) as HTMLSelectElement;
			fireEvent.change(picker, { target: { value: 'a' } });
			expect(onLensSelect).toHaveBeenCalledWith('a');
		});

		it('firing a change event with the sentinel value ("") does NOT call onLensSelect', () => {
			const onLensSelect = vi.fn();
			const { container } = render(
				<Toolbar
					lensNames={['a']}
					pickerValue="a"
					onLensSelect={onLensSelect}
					editButtonVisible={true}
					onEditReturn={() => {}}
				/>,
			);
			const picker = container.querySelector(
				'[data-orchestrator-lens-picker]',
			) as HTMLSelectElement;
			fireEvent.change(picker, { target: { value: '' } });
			expect(onLensSelect).not.toHaveBeenCalled();
		});
	});

	describe('Edit-return button — visible only when editButtonVisible is true', () => {
		it('editButtonVisible=false renders no [data-orchestrator-edit-button] element', () => {
			const { container } = render(
				<Toolbar
					lensNames={['a']}
					pickerValue=""
					onLensSelect={() => {}}
					editButtonVisible={false}
					onEditReturn={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-edit-button]'),
			).toBeNull();
		});

		it('editButtonVisible=true renders a <button data-orchestrator-edit-button>', () => {
			const { container } = render(
				<Toolbar
					lensNames={['a']}
					pickerValue="a"
					onLensSelect={() => {}}
					editButtonVisible={true}
					onEditReturn={() => {}}
				/>,
			);
			const editButton = container.querySelector(
				'[data-orchestrator-edit-button]',
			);
			expect(editButton?.tagName).toBe('BUTTON');
		});

		it('the edit button has accessible text content ("Edit code")', () => {
			const { container } = render(
				<Toolbar
					lensNames={['a']}
					pickerValue="a"
					onLensSelect={() => {}}
					editButtonVisible={true}
					onEditReturn={() => {}}
				/>,
			);
			const editButton = container.querySelector(
				'[data-orchestrator-edit-button]',
			);
			expect(editButton?.textContent).toBe('Edit code');
		});

		it('clicking the edit button calls onEditReturn', () => {
			const onEditReturn = vi.fn();
			const { container } = render(
				<Toolbar
					lensNames={['a']}
					pickerValue="a"
					onLensSelect={() => {}}
					editButtonVisible={true}
					onEditReturn={onEditReturn}
				/>,
			);
			const editButton = container.querySelector(
				'[data-orchestrator-edit-button]',
			) as HTMLButtonElement;
			fireEvent.click(editButton);
			expect(onEditReturn).toHaveBeenCalledTimes(1);
		});
	});
});
