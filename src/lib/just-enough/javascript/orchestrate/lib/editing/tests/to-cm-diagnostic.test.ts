import { describe, it, expect } from 'vitest';

import { Text } from '@codemirror/state';

import { toCMDiagnostic } from '../to-cm-diagnostic.js';
import type { DocEntry, LintDiagnostic } from '../types.js';

const SAMPLE_ENTRY: DocEntry = Object.freeze({
	description: 'sample',
	isJEJ: false,
	whyNotInJej: 'sample rationale',
});

function makeDoc(content: string): Text {
	return Text.of(content.split('\n'));
}

describe('toCMDiagnostic', () => {
	describe('severity remap', () => {
		it("'rejection' maps to CM 'warning' (teaching-boundary, not syntax error)", () => {
			const diag: LintDiagnostic = {
				line: 1,
				column: 0,
				severity: 'rejection',
				message: 'sample',
			};
			const cm = toCMDiagnostic(makeDoc('var x = 5;'), diag);
			expect(cm.severity).toBe('warning');
		});

		it("'error' passes through (parse failures stay red)", () => {
			const diag: LintDiagnostic = {
				line: 1,
				column: 0,
				severity: 'error',
				message: 'sample',
			};
			const cm = toCMDiagnostic(makeDoc('let x = ;'), diag);
			expect(cm.severity).toBe('error');
		});

		it("'warning' passes through unchanged", () => {
			const diag: LintDiagnostic = {
				line: 1,
				column: 0,
				severity: 'warning',
				message: 'sample',
			};
			const cm = toCMDiagnostic(makeDoc('x;'), diag);
			expect(cm.severity).toBe('warning');
		});
	});

	describe('renderMessage wiring', () => {
		it('attaches renderMessage when diagnostic carries an entry', () => {
			const diag: LintDiagnostic = {
				line: 1,
				column: 0,
				endLine: 1,
				endColumn: 3,
				severity: 'rejection',
				message: 'sample',
				entry: SAMPLE_ENTRY,
			};
			const cm = toCMDiagnostic(makeDoc('var x = 5;'), diag);
			expect(cm.renderMessage).toBeDefined();
		});

		it('does NOT set renderMessage when entry is absent', () => {
			const diag: LintDiagnostic = {
				line: 1,
				column: 0,
				severity: 'rejection',
				message: 'sample',
			};
			const cm = toCMDiagnostic(makeDoc('var x = 5;'), diag);
			expect(cm.renderMessage).toBeUndefined();
		});

		// Note: renderMessage's DOM construction (buildTooltipDom) requires
		// a browser `document` global and is covered by browser tests
		// elsewhere. Here we only verify that the callback is wired —
		// not that it returns a working Node when invoked in a Node
		// environment.
	});

	describe('range clamping', () => {
		it('clamps out-of-range line to last line', () => {
			const diag: LintDiagnostic = {
				line: 99,
				column: 0,
				severity: 'rejection',
				message: 'sample',
			};
			const cm = toCMDiagnostic(makeDoc('var x = 5;'), diag);
			expect(cm.from).toBeGreaterThanOrEqual(0);
			expect(cm.to).toBeGreaterThanOrEqual(cm.from);
		});
	});

	describe('field forwarding', () => {
		it('forwards message verbatim', () => {
			const diag: LintDiagnostic = {
				line: 1,
				column: 0,
				severity: 'rejection',
				message: "'var' declarations are not allowed at this language level",
			};
			const cm = toCMDiagnostic(makeDoc('var x = 5;'), diag);
			expect(cm.message).toBe(
				"'var' declarations are not allowed at this language level",
			);
		});

		it('forwards source verbatim', () => {
			const diag: LintDiagnostic = {
				line: 1,
				column: 0,
				severity: 'rejection',
				message: 'sample',
				source: 'JEJ',
			};
			const cm = toCMDiagnostic(makeDoc('var x = 5;'), diag);
			expect(cm.source).toBe('JEJ');
		});
	});
});
