import { describe, expect, it } from 'vitest';

import type { LanguageLevel } from '../../types.js';
import jejLevel from '../index.js';
import KEY from '../key.js';
import LABEL from '../label.js';
import notionalMachineRaw from '../notional-machine.md?raw';
import buildRealmModel from '../realm-model.js';
import referenceRaw from '../reference.md?raw';
import SNIPPET_TYPES from '../snippet-types.js';
import validate from '../validate.js';

describe('jejLevel', () => {
	describe('the spine (Interfaces)', () => {
		it('satisfies the level spine', () => {
			const spine: LanguageLevel = jejLevel;
			expect(spine).toBe(jejLevel);
		});

		it('is frozen', () => {
			expect(Object.isFrozen(jejLevel)).toBe(true);
		});
	});

	describe('the carried identity (Simple)', () => {
		it('key is the canonical KEY', () => {
			expect(jejLevel.key).toBe(KEY);
		});

		it('label is the canonical LABEL', () => {
			expect(jejLevel.label).toBe(LABEL);
		});
	});

	describe('the carried behavior (Interfaces)', () => {
		it('validate is the canonical validator', () => {
			expect(jejLevel.validate).toBe(validate);
		});

		it('models.realm is the canonical realm-model builder', () => {
			expect(jejLevel.models.realm).toBe(buildRealmModel);
		});

		it('snippetTypes is the canonical admitted set', () => {
			expect(jejLevel.snippetTypes).toBe(SNIPPET_TYPES);
		});
	});

	describe('the docs channel (Interfaces)', () => {
		it('reference is the raw reference.md text', () => {
			expect(jejLevel.docs.reference).toBe(referenceRaw);
		});

		it('reference carries the learner-facing title', () => {
			expect(jejLevel.docs.reference).toContain(
				'# Just Enough JavaScript (JEJ)',
			);
		});

		it('notionalMachine is the raw notional-machine.md text', () => {
			expect(jejLevel.docs.notionalMachine).toBe(notionalMachineRaw);
		});

		it('notionalMachine carries the machine title', () => {
			expect(jejLevel.docs.notionalMachine).toContain('# JEJ Notional Machine');
		});
	});

	describe('the editor-support channels (Interfaces)', () => {
		it('completion is null', () => {
			expect(jejLevel.editorSupport.completion).toBeNull();
		});

		it('format is null', () => {
			expect(jejLevel.editorSupport.format).toBeNull();
		});

		it('hover is null', () => {
			expect(jejLevel.editorSupport.hover).toBeNull();
		});
	});

	describe('the frozen substructures (Interfaces)', () => {
		it('docs is frozen', () => {
			expect(Object.isFrozen(jejLevel.docs)).toBe(true);
		});

		it('editorSupport is frozen', () => {
			expect(Object.isFrozen(jejLevel.editorSupport)).toBe(true);
		});

		it('models is frozen', () => {
			expect(Object.isFrozen(jejLevel.models)).toBe(true);
		});

		it('snippetTypes is frozen', () => {
			expect(Object.isFrozen(jejLevel.snippetTypes)).toBe(true);
		});
	});
});
