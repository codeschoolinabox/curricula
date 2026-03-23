/**
 * @file Integration tests for record().
 *
 * TODO: Add tests that trace real code strings through the full pipeline:
 *   - Step structure conformity (StepCore fields present, 1-indexed)
 *   - Error propagation (ParseError, RuntimeError, LimitExceededError)
 *
 * See @study-lenses/tracing for the StepCore contract.
 */

import { describe, it } from 'vitest';
import record from '../index.js';

describe('record', () => {
	it.todo('traces simple code and returns steps');
	it.todo('throws ParseError on syntax error');
	it.todo('throws RuntimeError on runtime error');
	it.todo('throws LimitExceededError when step limit exceeded');
	it.todo('throws LimitExceededError when iteration limit exceeded');
	it.todo('throws LimitExceededError when recursion limit exceeded');
	it.todo('throws LimitExceededError when time limit exceeded');
});
