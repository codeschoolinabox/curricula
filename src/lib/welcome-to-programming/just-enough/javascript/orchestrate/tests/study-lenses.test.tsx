// @vitest-environment jsdom

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import StudyLenses from '../index.js';

describe('<StudyLenses> — F1.A four-prop skeleton', () => {
	describe('Zero — empty-string snippet', () => {
		it('mounts without throwing and renders [data-orchestrator-root]', () => {
			const { container } = render(<StudyLenses snippet="" />);
			const root = container.querySelector('[data-orchestrator-root]');
			expect(root).not.toBeNull();
		});
	});

	describe('Exceptions — config supplied with no resolvable default', () => {
		it('throws at mount when config is set, lens is unset, and configs has no default key', () => {
			expect(() =>
				render(<StudyLenses snippet="let x = 5;" config={{}} />),
			).toThrow(/`config` requires a resolved default lens/);
		});
	});
});
