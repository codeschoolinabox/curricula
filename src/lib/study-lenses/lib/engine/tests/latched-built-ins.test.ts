import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import ts from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

const WORKER_DIRECTORY = fileURLToPath(new URL('../worker/', import.meta.url));

const WORKER_REALM = ['bootstrap.ts', 'read-call-response.ts'];
const THREAD_REALM = [
	'clear-event-ready.ts',
	'transport.ts',
	'write-call-response.ts',
	'write-resume-signal.ts',
];
const BOTH_REALMS = ['create-buffer-views.ts', 'protocol.ts'];
const TYPE_ONLY = ['types.ts'];

// WHY excluded: `undefined` is the one free identifier a program cannot rebind
// — the global property is non-writable and non-configurable by spec, so
// reading it live is never a latch defect. Every other name here is a writable
// global property and is.
const IMMUTABLE_GLOBALS = new Set(['undefined']);

type ScopeLike = {
	type: string;
	references: unknown[];
	childScopes: unknown[];
};

// WHY the cast: the `typescript-eslint` umbrella package re-exports the parser
// with a widened signature, so tsc sees one parameter and an `unknown` result.
// The parser package itself declares `(code, parserOptions?) =>
// ParseForESLintResult`, but it is a transitive dependency here — naming the
// shape this file actually consumes is cheaper than adding a direct one. The
// call stays on its object so the method keeps its receiver.
function parseModule(source: string): { globalScope: ScopeLike } {
	const parse = ts.parser.parseForESLint.bind(ts.parser) as unknown as (
		code: string,
		options: { sourceType: string; loc: boolean; range: boolean },
	) => { scopeManager: { globalScope: ScopeLike } };
	return parse(source, { sourceType: 'module', loc: true, range: true })
		.scopeManager;
}

// WHY a second instrument: placement is a question about names and this walk
// answers it, but a namespace capture and a callable capture mention the SAME
// name at module scope, so no predicate over identifier references can tell
// them apart. Capture shape is read off the initializer instead — and it is the
// only check that reaches the captured names no program can observe.
function namespaceCaptures(fileName: string): string[] {
	return bareNamespaceBindings(
		readFileSync(WORKER_DIRECTORY + fileName, 'utf8'),
	);
}

function bareNamespaceBindings(source: string): string[] {
	const bare: string[] = [];
	for (const line of source.split('\n')) {
		const match = /^const [A-Z_0-9]+ = ([A-Za-z_$][\w$]*);$/.exec(line.trim());
		if (match && CALLED_THROUGH.has(match[1])) {
			bare.push(match[1]);
		}
	}
	return bare.toSorted((left, right) => left.localeCompare(right));
}

// The namespaces whose members this subtree calls. Capturing one of these bare
// is the defect: `Atomics.store = …` defeats it, a member capture survives.
const CALLED_THROUGH = new Set(['Atomics', 'Object', 'URL']);

function ambientReads(fileName: string): string[] {
	return ambientNames(fileName, true);
}

function moduleScopeCaptures(fileName: string): string[] {
	return ambientNames(fileName, false);
}

function ambientNames(fileName: string, insideFunction: boolean): string[] {
	const source = readFileSync(WORKER_DIRECTORY + fileName, 'utf8');
	const names = new Set<string>();
	collectInto(names, parseModule(source).globalScope, false, insideFunction);
	return Array.from(names)
		.filter((name) => !IMMUTABLE_GLOBALS.has(name))
		.toSorted((left, right) => left.localeCompare(right));
}

// WHY resolve-to-global rather than the scope manager's `through` list: the
// global scope is pre-populated from TypeScript's lib declarations, and a name
// whose lib entry declares a value (`Object`) resolves there while a name whose
// entry is type-only (`Atomics`) does not. Reading `through` therefore reports
// an answer shaped by lib declaration style instead of by the latch property,
// and it silently misses `Object`.
function collectInto(
	names: Set<string>,
	scope: ScopeLike,
	inFunction: boolean,
	wantInFunction: boolean,
): void {
	const nowInFunction = inFunction || scope.type === 'function';
	if (nowInFunction === wantInFunction) {
		for (const reference of scope.references as {
			isTypeReference: boolean;
			resolved: { scope: { type: string } } | null;
			identifier: { name: string };
		}[]) {
			if (reference.isTypeReference) {
				continue;
			}
			if (
				reference.resolved === null ||
				reference.resolved.scope.type === 'global'
			) {
				names.add(reference.identifier.name);
			}
		}
	}
	for (const child of scope.childScopes as ScopeLike[]) {
		collectInto(names, child, nowInFunction, wantInFunction);
	}
}

describe('the latch rule over the worker realm', () => {
	it('classifies every module in the worker directory by realm', () => {
		const byName = (left: string, right: string): number =>
			left.localeCompare(right);
		const classified = [
			...WORKER_REALM,
			...THREAD_REALM,
			...BOTH_REALMS,
			...TYPE_ONLY,
		].toSorted(byName);

		expect(classified).toEqual(
			readdirSync(WORKER_DIRECTORY)
				.filter((name) => name.endsWith('.ts'))
				.toSorted(byName),
		);
	});

	it('reports the ambient reads a thread-realm module is free to make', () => {
		expect(ambientReads('transport.ts')).not.toEqual([]);
	});

	it('detects a bare namespace capture', () => {
		expect(bareNamespaceBindings('const ATOMICS = Atomics;')).toEqual([
			'Atomics',
		]);
	});

	it('accepts a member capture of the same namespace', () => {
		expect(bareNamespaceBindings('const STORE = Atomics.store;')).toEqual([]);
	});

	it.skip('bootstrap.ts reads no ambient name from inside a function body', () => {
		expect(ambientReads('bootstrap.ts')).toEqual([]);
	});

	it.skip('read-call-response.ts reads no ambient name from inside a function body', () => {
		expect(ambientReads('read-call-response.ts')).toEqual([]);
	});

	it.skip('create-buffer-views.ts reads no ambient name from inside a function body', () => {
		expect(ambientReads('create-buffer-views.ts')).toEqual([]);
	});

	it('protocol.ts reads no ambient name from inside a function body', () => {
		expect(ambientReads('protocol.ts')).toEqual([]);
	});

	it.skip('the captures in bootstrap.ts name exactly the globals the README lists for it', () => {
		expect(moduleScopeCaptures('bootstrap.ts')).toEqual([
			'Atomics',
			'Blob',
			'Error',
			'Function',
			'Object',
			'String',
			'URL',
			'globalThis',
			'postMessage',
		]);
	});

	it('bootstrap.ts captures no namespace whose members it calls', () => {
		expect(namespaceCaptures('bootstrap.ts')).toEqual([]);
	});

	it('read-call-response.ts captures no namespace whose members it calls', () => {
		expect(namespaceCaptures('read-call-response.ts')).toEqual([]);
	});

	it('create-buffer-views.ts captures no namespace whose members it calls', () => {
		expect(namespaceCaptures('create-buffer-views.ts')).toEqual([]);
	});
});
