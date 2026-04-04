/**
 * @file Investigation: TDZ behavior in block@declaration frame across Aran modes.
 *
 * Question: does `let x = 5` produce a TDZ symbol or the actual value `5`
 * in the block@declaration frame? Does this differ between eval and script mode?
 */

import { describe, expect, it } from 'vitest';
import { parse } from 'acorn';
import { transpile, weaveFlexible, retropile } from 'aran';
import { generate } from 'astring';

function inspectDeclarationFrames(
	code: string,
	kind: string,
	situ: Record<string, unknown>,
): { frames: Array<Record<string, unknown>>; effects: string[] } {
	const ast = parse(code, {
		ecmaVersion: 2024,
		sourceType: 'script',
		locations: true,
	});

	const frames: Array<Record<string, unknown>> = [];
	const effects: string[] = [];

	const pointcut: Record<string, unknown> = {
		_tdz_setup: {
			kind: 'block@setup',
			pointcut: () => ['setup'],
		},
		_tdz_decl: {
			kind: 'block@declaration',
			pointcut: () => ['decl'],
		},
		_tdz_effect: {
			kind: 'effect@before',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			pointcut: (node: any) => [node.type],
		},
	};

	const aranAST = transpile(
		{ kind, situ, root: ast, path: 'test.js' },
		{ global_declarative_record: 'builtin' },
	);

	const woven = weaveFlexible(aranAST, {
		initial_state: null,
		pointcut,
	});

	const output = retropile(woven, { mode: 'standalone' });
	const instrumentedCode = generate(output);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(globalThis as any)._tdz_setup = (state: unknown) => state;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(globalThis as any)._tdz_decl = (
		_state: unknown,
		frame: Record<string, unknown>,
	) => {
		const snapshot: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(frame)) {
			if (k.startsWith('.') || k === 'this' || k === 'import') continue;
			snapshot[k] = {
				value: v,
				type: typeof v,
				isSymbol: typeof v === 'symbol',
			};
		}
		if (Object.keys(snapshot).length > 0) {
			frames.push(snapshot);
		}
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(globalThis as any)._tdz_effect = (
		_state: unknown,
		effectType: string,
	) => {
		effects.push(effectType);
	};

	// eslint-disable-next-line no-new-func
	new Function(instrumentedCode)();

	// Cleanup
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	delete (globalThis as any)._tdz_setup;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	delete (globalThis as any)._tdz_decl;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	delete (globalThis as any)._tdz_effect;

	return { frames, effects };
}

describe('TDZ investigation', () => {
	describe('eval + strict mode', () => {
		it('frame values for let x = 5', () => {
			const result = inspectDeclarationFrames(
				'let x = 5;\n',
				'eval',
				{ type: 'local', mode: 'strict' },
			);
			console.log('eval+strict frames:', JSON.stringify(result.frames, null, 2));
			console.log('eval+strict effects:', result.effects);
			expect(result.frames.length).toBeGreaterThan(0);
		});

		it('frame values for let x = 5; let y = x + 1', () => {
			const result = inspectDeclarationFrames(
				'let x = 5;\nlet y = x + 1;\n',
				'eval',
				{ type: 'local', mode: 'strict' },
			);
			console.log('eval+strict multi frames:', JSON.stringify(result.frames, null, 2));
			console.log('eval+strict multi effects:', result.effects);
			expect(result.frames.length).toBeGreaterThan(0);
		});
	});

	describe('script mode', () => {
		it('frame values for let x = 5', () => {
			const result = inspectDeclarationFrames(
				'let x = 5;\n',
				'script',
				{ type: 'global' },
			);
			console.log('script frames:', JSON.stringify(result.frames, null, 2));
			console.log('script effects:', result.effects);
			expect(result.frames.length).toBeGreaterThan(0);
		});
	});
});
