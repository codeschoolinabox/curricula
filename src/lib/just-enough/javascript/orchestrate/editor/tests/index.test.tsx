// @vitest-environment jsdom

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import EditorComponent from '../index.js';

describe('<EditorComponent> — F2.1', () => {
	describe('Zero — minimal mount', () => {
		it('renders without throwing for an empty snippet', () => {
			const { container } = render(<EditorComponent snippet="" />);
			const host = container.querySelector('[data-orchestrator-host]');
			expect(host).not.toBeNull();
		});

		it('the host element is NOT readOnly', () => {
			const { container } = render(<EditorComponent snippet="" />);
			const host = container.querySelector<HTMLTextAreaElement>(
				'[data-orchestrator-host]',
			);
			expect(host?.readOnly).toBe(false);
		});
	});

	describe('One — onSnippetChange callback wiring', () => {
		it('fires onSnippetChange with the new value on a change event', () => {
			const spy = vi.fn();
			const { container } = render(
				<EditorComponent snippet="x" onSnippetChange={spy} />,
			);
			const host = container.querySelector<HTMLTextAreaElement>(
				'[data-orchestrator-host]',
			)!;
			fireEvent.change(host, { target: { value: 'xy' } });
			expect(spy).toHaveBeenCalledOnce();
			expect(spy).toHaveBeenCalledWith('xy');
		});
	});

	describe('Many — multiple change events', () => {
		it('fires onSnippetChange for each change event in order', () => {
			const calls: string[] = [];
			const spy = vi.fn((v: string) => calls.push(v));
			const { container } = render(
				<EditorComponent snippet="a" onSnippetChange={spy} />,
			);
			const host = container.querySelector<HTMLTextAreaElement>(
				'[data-orchestrator-host]',
			)!;
			fireEvent.change(host, { target: { value: 'ab' } });
			fireEvent.change(host, { target: { value: 'abc' } });
			fireEvent.change(host, { target: { value: 'abcd' } });
			expect(calls).toEqual(['ab', 'abc', 'abcd']);
		});
	});

	describe('Boundaries — no callback supplied', () => {
		it('mounts and accepts change events without throwing when onSnippetChange is omitted', () => {
			const { container } = render(<EditorComponent snippet="x" />);
			const host = container.querySelector<HTMLTextAreaElement>(
				'[data-orchestrator-host]',
			)!;
			expect(() =>
				fireEvent.change(host, { target: { value: 'xy' } }),
			).not.toThrow();
		});

		it('textarea is controlled by the snippet prop — rerender with new prop overrides event-edited value', () => {
			// Guards against a `defaultValue` (uncontrolled) implementation.
			// An uncontrolled textarea would retain the event-edited value across
			// rerenders; a controlled one (value={snippet}) reflects the prop.
			const spy = vi.fn();
			const { container, rerender } = render(
				<EditorComponent snippet="v1" onSnippetChange={spy} />,
			);
			const host = container.querySelector<HTMLTextAreaElement>(
				'[data-orchestrator-host]',
			)!;
			fireEvent.change(host, { target: { value: 'v1-edited' } });
			rerender(<EditorComponent snippet="v2" onSnippetChange={spy} />);
			expect(host.value).toBe('v2');
		});
	});
});
