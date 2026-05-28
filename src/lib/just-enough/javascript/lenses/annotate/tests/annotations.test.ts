/**
 * @file Pure-TS tests for the `annotate` lens annotation state model.
 * No React, no jsdom. ZOMBIES coverage of the five per-view ops and the
 * toggle-preserves-annotations invariant (inactive view stays
 * reference-identical) per `../README.md` § Tool contract and
 * `../DOCS.md` § Phase 4 Handle interaction.
 */

import { describe, expect, it } from 'vitest';

import annotationOps from '../annotations.js';
import type { AnnotationsByView, Note, Stroke } from '../types.js';

function emptyPair(): AnnotationsByView {
	return {
		code: { strokes: [], notes: [] },
		flowchart: { strokes: [], notes: [] },
	};
}

const stroke: Stroke = {
	id: 's1',
	points: [
		{ x: 0, y: 0 },
		{ x: 1, y: 1 },
	],
	color: '#ff0000',
};

const stroke2: Stroke = { id: 's2', points: [{ x: 2, y: 2 }], color: '#0000ff' };

const note: Note = {
	id: 'n1',
	position: { x: 5, y: 5 },
	text: 'hi',
	color: '#00ff00',
};

const note2: Note = {
	id: 'n2',
	position: { x: 9, y: 9 },
	text: 'yo',
	color: '#0000ff',
};

describe('annotationOps', () => {
	describe('addStroke', () => {
		it('appends the stroke to the active view strokes', () => {
			const result = annotationOps.addStroke(emptyPair(), 'code', stroke);
			expect(result.code.strokes).toEqual([stroke]);
		});

		it('preserves pre-existing strokes (appends, not replaces)', () => {
			const start: AnnotationsByView = {
				code: { strokes: [stroke], notes: [] },
				flowchart: { strokes: [], notes: [] },
			};
			const result = annotationOps.addStroke(start, 'code', stroke2);
			expect(result.code.strokes).toEqual([stroke, stroke2]);
		});

		it('leaves the active view notes untouched', () => {
			const start: AnnotationsByView = {
				code: { strokes: [], notes: [note] },
				flowchart: { strokes: [], notes: [] },
			};
			const result = annotationOps.addStroke(start, 'code', stroke);
			expect(result.code.notes).toEqual([note]);
		});

		it('keeps the inactive view reference-identical', () => {
			const start = emptyPair();
			const result = annotationOps.addStroke(start, 'code', stroke);
			expect(result.flowchart).toBe(start.flowchart);
		});

		it('returns a new pair, not the input (no in-place mutation)', () => {
			const start = emptyPair();
			const result = annotationOps.addStroke(start, 'code', stroke);
			expect(result).not.toBe(start);
		});

		it('replaces the active view with a new AnnotationSet reference', () => {
			const start = emptyPair();
			const result = annotationOps.addStroke(start, 'code', stroke);
			expect(result.code).not.toBe(start.code);
		});

		it('returns a frozen pair', () => {
			const result = annotationOps.addStroke(emptyPair(), 'code', stroke);
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('freezes the active view AnnotationSet', () => {
			const result = annotationOps.addStroke(emptyPair(), 'code', stroke);
			expect(Object.isFrozen(result.code)).toBe(true);
		});

		it('freezes the active view strokes array (deep)', () => {
			const result = annotationOps.addStroke(emptyPair(), 'code', stroke);
			expect(Object.isFrozen(result.code.strokes)).toBe(true);
		});
	});

	describe('removeStroke', () => {
		it('removes the stroke with the matching id', () => {
			const start: AnnotationsByView = {
				code: { strokes: [stroke, stroke2], notes: [] },
				flowchart: { strokes: [], notes: [] },
			};
			const result = annotationOps.removeStroke(start, 'code', 's1');
			expect(result.code.strokes).toEqual([stroke2]);
		});

		it('is a no-op when the id is absent', () => {
			const start: AnnotationsByView = {
				code: { strokes: [stroke], notes: [] },
				flowchart: { strokes: [], notes: [] },
			};
			const result = annotationOps.removeStroke(start, 'code', 'missing');
			expect(result.code.strokes).toEqual([stroke]);
		});

		it('keeps the inactive view reference-identical', () => {
			const start: AnnotationsByView = {
				code: { strokes: [stroke], notes: [] },
				flowchart: { strokes: [stroke2], notes: [] },
			};
			const result = annotationOps.removeStroke(start, 'code', 's1');
			expect(result.flowchart).toBe(start.flowchart);
		});
	});

	describe('addNote', () => {
		it('appends the note to the active view notes', () => {
			const result = annotationOps.addNote(emptyPair(), 'flowchart', note);
			expect(result.flowchart.notes).toEqual([note]);
		});

		it('keeps the inactive view reference-identical', () => {
			const start = emptyPair();
			const result = annotationOps.addNote(start, 'flowchart', note);
			expect(result.code).toBe(start.code);
		});

		it('replaces the active view with a new AnnotationSet reference', () => {
			const start = emptyPair();
			const result = annotationOps.addNote(start, 'flowchart', note);
			expect(result.flowchart).not.toBe(start.flowchart);
		});
	});

	describe('removeNote', () => {
		it('removes the note with the matching id', () => {
			const start: AnnotationsByView = {
				code: { strokes: [], notes: [note, note2] },
				flowchart: { strokes: [], notes: [] },
			};
			const result = annotationOps.removeNote(start, 'code', 'n1');
			expect(result.code.notes).toEqual([note2]);
		});

		it('keeps the inactive view reference-identical', () => {
			const start: AnnotationsByView = {
				code: { strokes: [], notes: [note] },
				flowchart: { strokes: [], notes: [note2] },
			};
			const result = annotationOps.removeNote(start, 'code', 'n1');
			expect(result.flowchart).toBe(start.flowchart);
		});
	});

	describe('clearView', () => {
		it('empties the active view strokes', () => {
			const start: AnnotationsByView = {
				code: { strokes: [stroke], notes: [note] },
				flowchart: { strokes: [], notes: [] },
			};
			const result = annotationOps.clearView(start, 'code');
			expect(result.code.strokes).toEqual([]);
		});

		it('empties the active view notes', () => {
			const start: AnnotationsByView = {
				code: { strokes: [stroke], notes: [note] },
				flowchart: { strokes: [], notes: [] },
			};
			const result = annotationOps.clearView(start, 'code');
			expect(result.code.notes).toEqual([]);
		});

		it('keeps the inactive view reference-identical', () => {
			const start: AnnotationsByView = {
				code: { strokes: [stroke], notes: [note] },
				flowchart: { strokes: [stroke2], notes: [note2] },
			};
			const result = annotationOps.clearView(start, 'code');
			expect(result.flowchart).toBe(start.flowchart);
		});
	});
});
