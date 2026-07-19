// cspell:ignore Interner

import type { Node, Program } from 'acorn';
import { analyze } from 'eslint-scope';

import ECMA_VERSION from './ecma-version.js';
import type {
	Environment,
	FactStage,
	ScopeDefinition,
	SnippetType,
} from './types.js';

/**
 * Derive the environment fact stage from the syntax tree and the snippet
 * type: the static scope structure, projected into embody's own plain scope
 * objects — one graph, holding the source's own tree nodes by reference.
 *
 * @remarks
 * The graph toggles on the snippet type: a script's top-level names live on
 * the global scope, a module's on its own module scope. The analyzer's
 * objects never cross the boundary — embody projects the fields its contract
 * exposes into plain objects its freeze can actually reach; the analyzer's
 * private bookkeeping stays off the contract.
 */
export default function deriveEnvironment(
	type: SnippetType,
	ast: Program,
): FactStage<Environment> {
	const manager = analyze(ast, {
		sourceType: type,
		ecmaVersion: ECMA_VERSION,
	});
	// the analyzer's published types are stale (@types/eslint-scope omits
	// fields and types nodes as estree) — embody reads the manager through its
	// own structural view instead: one documented untyped-library boundary read
	const foreignRoot = manager.globalScope as unknown as ForeignScope;
	const root = projectScope(foreignRoot, newInterner());

	return { ok: true, value: { root, byPath: {} } };
}

// the analyzer's runtime shapes, described structurally — only the fields
// embody reads; nothing here types the contract surface
type ForeignScope = {
	type: string;
	block: Node;
	variables: ForeignVariable[];
	references: ForeignReference[];
	childScopes: ForeignScope[];
	through: ForeignReference[];
	isStrict: boolean;
	upper: ForeignScope | null;
};

type ForeignVariable = {
	name: string;
	identifiers: Node[];
	references: ForeignReference[];
	defs: ForeignDefinition[];
};

type ForeignReference = {
	identifier: Node;
	resolved: ForeignVariable | null;
	from: ForeignScope;
};

type ForeignDefinition = {
	type: string;
	name: Node;
	node: Node;
};

// the scope graph is cyclic (upper↔childScopes, resolved↔references), so the
// projection builds by local mutation and only the readonly view leaves this
// file (precedent: guard-loops.ts)
type BuildingScope = {
	type: string;
	block: Node;
	variables: BuildingVariable[];
	references: BuildingReference[];
	childScopes: BuildingScope[];
	through: BuildingReference[];
	isStrict: boolean;
	upper: BuildingScope | null;
};

type BuildingVariable = {
	name: string;
	identifiers: Node[];
	references: BuildingReference[];
	defs: ScopeDefinition[];
};

type BuildingReference = {
	identifier: Node;
	resolved: BuildingVariable | null;
	from: BuildingScope;
};

// transient build-time interning, keyed by the analyzer's object identities —
// one embody object per analyzer object, reused across every container, so
// the projection stays one shared graph (DEV.md § 13 sanctions exactly this
// transient internal Map use; it is discarded when the projection returns)
type Interner = {
	scopes: Map<ForeignScope, BuildingScope>;
	filledScopes: Set<ForeignScope>;
	variables: Map<ForeignVariable, BuildingVariable>;
	references: Map<ForeignReference, BuildingReference>;
};

function newInterner(): Interner {
	return {
		scopes: new Map(),
		filledScopes: new Set(),
		variables: new Map(),
		references: new Map(),
	};
}

/**
 * The interned scope object for `foreign`, created empty on first sight —
 * registration without any recursive walk, so any container can hold the one
 * shared object before its fields fill. Every scope descends from the global
 * scope, so the root walk fills every shell before the projection returns.
 */
function scopeShell(foreign: ForeignScope, intern: Interner): BuildingScope {
	const interned = intern.scopes.get(foreign);
	if (interned !== undefined) {
		return interned;
	}

	const shell: BuildingScope = {
		type: foreign.type,
		block: foreign.block,
		variables: [],
		references: [],
		childScopes: [],
		through: [],
		isStrict: foreign.isStrict,
		upper: null,
	};
	intern.scopes.set(foreign, shell);
	return shell;
}

// every projector registers BEFORE recursing (the cycle guard the deep-freeze
// walk uses), so the cyclic wiring lands on the one shared object — a scope's
// fill is additionally guarded by `filledScopes`, because its shell may
// already be interned through a reference chase
function projectScope(foreign: ForeignScope, intern: Interner): BuildingScope {
	const scope = scopeShell(foreign, intern);
	if (intern.filledScopes.has(foreign)) {
		return scope;
	}
	intern.filledScopes.add(foreign);

	scope.upper =
		foreign.upper === null ? null : projectScope(foreign.upper, intern);
	scope.variables = foreign.variables.map((variable) =>
		projectVariable(variable, intern),
	);
	scope.references = foreign.references.map((reference) =>
		projectReference(reference, intern),
	);
	scope.childScopes = foreign.childScopes.map((child) =>
		projectScope(child, intern),
	);
	scope.through = foreign.through.map((reference) =>
		projectReference(reference, intern),
	);

	return scope;
}

function projectVariable(
	foreign: ForeignVariable,
	intern: Interner,
): BuildingVariable {
	const interned = intern.variables.get(foreign);
	if (interned !== undefined) {
		return interned;
	}

	const variable: BuildingVariable = {
		name: foreign.name,
		identifiers: [...foreign.identifiers],
		references: [],
		defs: [],
	};
	intern.variables.set(foreign, variable);

	variable.references = foreign.references.map((reference) =>
		projectReference(reference, intern),
	);
	variable.defs = foreign.defs.map((definition) => ({
		type: definition.type,
		name: definition.name,
		node: definition.node,
	}));

	return variable;
}

function projectReference(
	foreign: ForeignReference,
	intern: Interner,
): BuildingReference {
	const interned = intern.references.get(foreign);
	if (interned !== undefined) {
		return interned;
	}

	// only the from-scope's SHELL is taken here — never its full projection:
	// filling the scope walks its own references back into this one, so this
	// reference registers first and the walk lands on it, never on a copy
	const reference: BuildingReference = {
		identifier: foreign.identifier,
		resolved: null,
		from: scopeShell(foreign.from, intern),
	};
	intern.references.set(foreign, reference);

	reference.resolved =
		foreign.resolved === null
			? null
			: projectVariable(foreign.resolved, intern);

	return reference;
}
