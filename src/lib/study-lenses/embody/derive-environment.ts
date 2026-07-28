// cspell:ignore Interner

import type { AnyNode, Identifier, Literal, Node, Program } from 'acorn';
import { analyze } from 'eslint-scope';

import ECMA_VERSION from './ecma-version.js';
import toStageCause from './to-stage-cause.js';
import type {
	Entwined,
	Environment,
	FactStage,
	NodePath,
	ScopeAccess,
	SnippetType,
	UsedBeforeBound,
} from './types.js';

/**
 * Derive the environment fact stage from the syntax tree, the snippet type,
 * and the entwined binding: the static scope structure, projected into
 * embody's own plain scope objects — one graph, holding the source's own
 * tree nodes by reference — indexed by the entwined graph's node paths.
 *
 * @remarks
 * The graph toggles on the snippet type: a script's top-level names live on
 * the global scope, a module's on its own module scope. The analyzer's
 * objects never cross the boundary — embody projects the fields its contract
 * exposes into plain objects its freeze can actually reach; the analyzer's
 * private bookkeeping stays off the contract. A failed upstream stage
 * short-circuits, carrying its cause unchanged — the origin stays named. A
 * throw inside the analysis or the projection is an embody defect, not
 * learner data: loud to the developer, a tagged `environment` cause to the
 * learner — never a throw.
 */
export default function deriveEnvironment(
	type: SnippetType,
	ast: FactStage<Program>,
	entwined: FactStage<Entwined>,
): FactStage<Environment> {
	// the first upstream failure's cause carries, its origin still named —
	// ast's cause already carries a tokens origin, entwined's carries both
	if (!ast.ok) {
		return { ok: false, cause: ast.cause };
	}
	if (!entwined.ok) {
		return { ok: false, cause: entwined.cause };
	}

	try {
		const manager = analyze(ast.value, {
			sourceType: type,
			ecmaVersion: ECMA_VERSION,
		});
		// the analyzer's published types are stale (@types/eslint-scope omits
		// fields and types nodes as estree) — embody reads the manager through
		// its own structural view: one documented untyped-library boundary read
		const foreignRoot = manager.globalScope as unknown as ForeignScope;
		const intern = newInterner();
		const root = projectScope(foreignRoot, intern);

		// ast and entwined must be co-derived from one snippet: byPath reads
		// paths for the very nodes this tree holds. Build the node→path reversal
		// once and share it between the cross-link stamp and the scope index.
		const pathOf = new Map<Node, NodePath>();
		const eagerlyInvoked = new Set<Node>();
		for (const tied of Object.values(entwined.value.byPath)) {
			pathOf.set(tied.node, tied.path);
			collectEagerInvocation(tied.node, eagerlyInvoked);
		}

		// second pass over the interned records — every reference is resolved by
		// now: stamp each identifier's path and derive usedBeforeBound
		stampReferences(intern, pathOf, eagerlyInvoked);
		stampDefinitions(intern, pathOf);
		stampExports(root, ast.value, type);

		const byPath = indexByPath(root, pathOf);

		return { ok: true, value: { root, byPath } };
	} catch (error) {
		// a throw here is an embody-integration defect (the analysis or the
		// projection over a valid tree) — loud to the developer, graceful data
		// to the learner
		console.error(
			`deriveEnvironment: the scope analysis threw over a valid tree — broken embody invariant (${
				error instanceof Error ? error.message : String(error)
			})`,
		);
		return { ok: false, cause: toStageCause(error, 'environment') };
	}
}

/**
 * Every scope keyed by the path of the node that introduces it. The global
 * and module scopes share the Program node, so `$` resolves innermost-wins:
 * parents write before children and the deepest writer stands (the byOffset
 * precedent). The node→path reversal is built once by the caller — the one
 * place the package derives paths — and shared with the cross-link stamp
 * (DEV.md § 13).
 */
function indexByPath(
	root: BuildingScope,
	pathOf: Map<Node, NodePath>,
): Record<NodePath, BuildingScope> {
	const byPath: Record<NodePath, BuildingScope> = {};
	fillByPath(root, pathOf, byPath);
	return byPath;
}

// parent-before-child keeps the innermost scope the last writer at a shared
// key. A scope's block is always a node of the very tree the entwining
// indexed, so the lookup cannot miss on a valid tree — the guard only
// narrows the Map's undefined arm.
function fillByPath(
	scope: BuildingScope,
	pathOf: Map<Node, NodePath>,
	byPath: Record<NodePath, BuildingScope>,
): void {
	const path = pathOf.get(scope.block);
	if (path !== undefined) {
		byPath[path] = scope;
	}
	for (const child of scope.childScopes) {
		fillByPath(child, pathOf, byPath);
	}
}

// guard-and-omit: a node absent from byPath simply carries no path — never
// assign undefined. The reference stamp also derives usedBeforeBound here, now
// that every reference is resolved.
function stampReferences(
	intern: Interner,
	pathOf: Map<Node, NodePath>,
	eagerlyInvoked: ReadonlySet<Node>,
): void {
	for (const reference of intern.references.values()) {
		const path = pathOf.get(reference.identifier);
		if (path !== undefined) {
			reference.path = path;
		}
		reference.usedBeforeBound = usedBeforeBound(reference, eagerlyInvoked);
	}
}

// a synchronous, non-generator function called in place — its body runs eagerly
// when the call is evaluated, so a dead-zone read inside it is eager, not deferred
function collectEagerInvocation(node: Node, eagerlyInvoked: Set<Node>): void {
	const call = node as AnyNode;
	if (call.type !== 'CallExpression') {
		return;
	}
	const { callee } = call;
	if (
		(callee.type === 'ArrowFunctionExpression' ||
			callee.type === 'FunctionExpression') &&
		!callee.async &&
		!callee.generator
	) {
		eagerlyInvoked.add(callee);
	}
}

function stampDefinitions(intern: Interner, pathOf: Map<Node, NodePath>): void {
	for (const variable of intern.variables.values()) {
		for (const definition of variable.defs) {
			const path = pathOf.get(definition.name);
			if (path !== undefined) {
				definition.path = path;
			}
		}
	}
}

/**
 * The module's export interface, stamped onto the bindings it names: each
 * binding records the external names it is exported under (the ECMAScript
 * ExportEntries whose local name is that binding). The analyzer models no export
 * status, so embody reads it from the export declarations themselves, not
 * inferred. Only a module exports, and an export declaration is
 * only valid at a module's top level, so the program's own body is the whole
 * search; matching within the module scope alone keeps an exported class's inner
 * class-scope binding untouched (it shares the declaration's identifier node).
 */
function stampExports(
	root: BuildingScope,
	program: Program,
	type: SnippetType,
): void {
	if (type !== 'module') {
		return;
	}
	const moduleScope = root.childScopes.find((scope) => scope.type === 'module');
	if (moduleScope === undefined) {
		return;
	}
	for (const statement of program.body) {
		for (const [local, exported] of exportEntriesOf(statement)) {
			const variable = moduleScope.variables.find(
				(candidate) => candidate.name === local,
			);
			if (variable !== undefined) {
				variable.exportedNames.push(exported);
			}
		}
	}
}

// one statement's export entries as [local binding name, external name]. A
// re-export (`… from '…'`) and `export *` bind no local name, so they yield none.
function exportEntriesOf(statement: AnyNode): Array<[string, string]> {
	if (statement.type === 'ExportDefaultDeclaration') {
		const local = defaultExportLocalName(statement.declaration);
		return local === null ? [] : [[local, 'default']];
	}
	if (
		statement.type !== 'ExportNamedDeclaration' ||
		statement.source !== null
	) {
		return [];
	}
	const { declaration, specifiers } = statement;
	if (declaration !== null && declaration !== undefined) {
		return declaredNames(declaration).map((name) => [name, name]);
	}
	return specifiers.map((specifier) => [
		moduleExportName(specifier.local),
		moduleExportName(specifier.exported),
	]);
}

// an export name is an identifier or, since ES2022, a string literal
function moduleExportName(node: Identifier | Literal): string {
	return node.type === 'Literal' ? String(node.value) : node.name;
}

// a default-exported binding: a named function or class declaration, or a bare
// reference to a binding. An anonymous declaration or any other expression
// exports a value, not a binding, and names nothing local.
function defaultExportLocalName(declaration: AnyNode): string | null {
	if (declaration.type === 'Identifier') {
		return declaration.name;
	}
	if (
		declaration.type === 'FunctionDeclaration' ||
		declaration.type === 'ClassDeclaration'
	) {
		return declaration.id === null ? null : declaration.id.name;
	}
	return null;
}

// every binding a declaration export introduces — a declaration binds several
// names when its declarator ids are patterns (`export const { a, b } = …`)
function declaredNames(declaration: AnyNode): string[] {
	if (declaration.type === 'VariableDeclaration') {
		const names: string[] = [];
		for (const declarator of declaration.declarations) {
			collectPatternNames(declarator.id, names);
		}
		return names;
	}
	if (
		declaration.type === 'FunctionDeclaration' ||
		declaration.type === 'ClassDeclaration'
	) {
		return declaration.id === null ? [] : [declaration.id.name];
	}
	return [];
}

// the names a binding pattern introduces, in source order — the pattern's own
// identifiers, never the object keys it reads (`{ a: c }` binds `c`)
function collectPatternNames(pattern: AnyNode, names: string[]): void {
	if (pattern.type === 'Identifier') {
		names.push(pattern.name);
		return;
	}
	if (pattern.type === 'ObjectPattern') {
		for (const property of pattern.properties) {
			collectPatternNames(
				property.type === 'RestElement' ? property.argument : property.value,
				names,
			);
		}
		return;
	}
	if (pattern.type === 'ArrayPattern') {
		for (const element of pattern.elements) {
			if (element !== null) {
				collectPatternNames(element, names);
			}
		}
		return;
	}
	if (pattern.type === 'AssignmentPattern') {
		collectPatternNames(pattern.left, names);
		return;
	}
	if (pattern.type === 'RestElement') {
		collectPatternNames(pattern.argument, names);
	}
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
	// the analyzer's public read/write predicates and its write-side fields —
	// `init`/`writeExpr` exist only when the reference writes (undefined on reads)
	isRead(): boolean;
	isWrite(): boolean;
	init?: boolean;
	writeExpr?: Node | null;
};

type ForeignDefinition = {
	type: string;
	name: Node;
	node: Node;
	// `let`/`const`/`var` only for variable declarations; `null` for parameters/
	// imports/functions/classes/catch, `undefined` for the inner class binding
	kind?: string | null;
	parent?: Node | null;
	index?: number | null;
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
	defs: BuildingDefinition[];
	exportedNames: string[];
};

// mutable during the build so the post-projection pass can stamp `path`; the
// frozen readonly ScopeDefinition view leaves only at the Scope boundary
type BuildingDefinition = {
	type: string;
	name: Node;
	node: Node;
	kind?: 'let' | 'const' | 'var';
	parent: Node | null;
	index: number | null;
	path?: NodePath;
};

type BuildingReference = {
	identifier: Node;
	resolved: BuildingVariable | null;
	from: BuildingScope;
	access: ScopeAccess;
	init: boolean;
	usedBeforeBound: UsedBeforeBound;
	writeExpr?: Node | null;
	path?: NodePath;
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
		// the export interface is stamped after projection, from the module's own
		// export declarations — the analyzer models no export status
		exportedNames: [],
	};
	intern.variables.set(foreign, variable);

	variable.references = foreign.references.map((reference) =>
		projectReference(reference, intern),
	);
	// index uses `?? null` (0 is a valid position); kind is allowlisted so a
	// non-variable binding gets no `kind` own-property at all (absent, not null)
	variable.defs = foreign.defs.map((definition) => ({
		type: definition.type,
		name: definition.name,
		node: definition.node,
		parent: definition.parent ?? null,
		index: definition.index ?? null,
		...(definition.kind === 'var' ||
		definition.kind === 'let' ||
		definition.kind === 'const'
			? { kind: definition.kind }
			: {}),
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
		access: accessOf(foreign),
		init: foreign.init ?? false,
		// bootstrap — the real value is stamped in the post-projection pass, once
		// every reference is resolved (usedBeforeBound reads the resolved binding)
		usedBeforeBound: false,
		// present exactly when the use writes: null for an update (x++/--x), the
		// RHS node otherwise. Absent on reads, so `'writeExpr' in ref` ⟺ isWrite
		...(foreign.isWrite() ? { writeExpr: foreign.writeExpr ?? null } : {}),
	};
	intern.references.set(foreign, reference);

	reference.resolved =
		foreign.resolved === null
			? null
			: projectVariable(foreign.resolved, intern);

	return reference;
}

// read/write/readwrite from the analyzer's public predicates, never its
// @private flag bitfield. 'readwrite' is spelled to contain both 'read' and
// 'write' so a consumer can test membership by substring — the pinned contract.
function accessOf(foreign: ForeignReference): ScopeAccess {
	if (!foreign.isWrite()) {
		return 'read';
	}
	return foreign.isRead() ? 'readwrite' : 'write';
}

// how a use relates to its resolved let/const/class binding when the use precedes
// the binding's initialization: `'eager'` (read at a fixed point), `'deferred'`
// (run later — inside a function or an instance field initializer), or `false`.
// A derived fact, not the analyzer's reading; a consumer draws any throw
// inference. var/parameter/function/import/catch bindings have no dead zone; the
// binding's own initializer write is excluded by `init`. Default-parameter TDZ
// (`(a = b, b) => …`) is out of scope — a Parameter def's node is the whole
// function, so the model cannot express the parameter's own position.
function usedBeforeBound(
	reference: BuildingReference,
	eagerlyInvoked: ReadonlySet<Node>,
): UsedBeforeBound {
	const variable = reference.resolved;
	if (variable === null || reference.init) {
		return false;
	}
	const binding = variable.defs.find(
		(definition) =>
			definition.kind === 'let' ||
			definition.kind === 'const' ||
			definition.type === 'ClassName',
	);
	if (
		binding === undefined ||
		!beforeInitialization(reference, binding, variable)
	) {
		return false;
	}
	return evaluatedEagerly(reference, variable, eagerlyInvoked)
		? 'eager'
		: 'deferred';
}

// a use precedes its binding's initialization. For let/const the boundary is the
// declarator's end (a for-of/for-in loop variable is initialized after its
// iterable, so a use inside that iterable counts too). A class binding
// initializes after its heritage and computed keys, before any method, field, or
// static block runs — so a class-name use counts only before the `class` keyword
// or inside the class's own extends expression or a computed key (recognized
// positionally, so a closure nested there still counts).
function beforeInitialization(
	reference: BuildingReference,
	binding: BuildingDefinition,
	variable: BuildingVariable,
): boolean {
	const use = reference.identifier.start;
	if (binding.type === 'ClassName') {
		const cls = binding.node as AnyNode;
		return use < cls.start || inClassDeadZone(use, cls);
	}
	return use < binding.node.end || usedInLoopHead(reference, variable);
}

// the heritage expression and every computed member key of a class run before the
// class binding is initialized
function inClassDeadZone(use: number, cls: AnyNode): boolean {
	if (cls.type !== 'ClassDeclaration' && cls.type !== 'ClassExpression') {
		return false;
	}
	if (within(use, cls.superClass)) {
		return true;
	}
	return cls.body.body.some(
		(member) =>
			(member.type === 'PropertyDefinition' ||
				member.type === 'MethodDefinition') &&
			member.computed &&
			within(use, member.key),
	);
}

function within(
	offset: number,
	node: { start: number; end: number } | null | undefined,
): boolean {
	return (
		node !== null &&
		node !== undefined &&
		node.start <= offset &&
		offset < node.end
	);
}

// eager unless deferred: walking from the use to its binding's scope crosses a
// deferred-execution scope — a function (unless it is a synchronous, non-generator
// function called in place, whose body runs eagerly) or an instance field
// initializer (a static field or static block runs eagerly at class definition;
// only an instance field runs later, at construction).
function evaluatedEagerly(
	reference: BuildingReference,
	variable: BuildingVariable,
	eagerlyInvoked: ReadonlySet<Node>,
): boolean {
	for (
		let scope: BuildingScope | null = reference.from;
		scope !== null;
		scope = scope.upper
	) {
		if (scope.variables.includes(variable)) {
			return true;
		}
		if (isDeferredScope(scope, eagerlyInvoked)) {
			return false;
		}
	}
	return true;
}

function isDeferredScope(
	scope: BuildingScope,
	eagerlyInvoked: ReadonlySet<Node>,
): boolean {
	if (scope.type === 'function') {
		return !eagerlyInvoked.has(scope.block);
	}
	return scope.type === 'class-field-initializer' && !isStaticField(scope);
}

// a class-field-initializer scope's `block` sits inside its PropertyDefinition,
// found by range within the enclosing class body; only a static field is eager
function isStaticField(scope: BuildingScope): boolean {
	const cls = scope.upper === null ? null : (scope.upper.block as AnyNode);
	if (
		cls === null ||
		(cls.type !== 'ClassDeclaration' && cls.type !== 'ClassExpression')
	) {
		return false;
	}
	const field = cls.body.body.find(
		(member) =>
			member.start <= scope.block.start && scope.block.end <= member.end,
	);
	return field?.type === 'PropertyDefinition' && field.static;
}

// a for-of/for-in loop variable is initialized per iteration, only AFTER its
// iterable is evaluated — so a use of that variable positioned inside the
// iterable is in the dead zone even though it sits after the declarator the
// positional check measures (`for (const x of [x])` throws). Walk enclosing
// scopes so a closure the iterable builds is recognized too — the tier of such a
// use is then decided by evaluatedEagerly. Only the loop's OWN variable has this
// dead zone — an outer name used in the iterable is already bound.
function usedInLoopHead(
	reference: BuildingReference,
	variable: BuildingVariable,
): boolean {
	const use = reference.identifier.start;
	for (
		let scope: BuildingScope | null = reference.from;
		scope !== null;
		scope = scope.upper
	) {
		if (scope.type !== 'for' || !scope.variables.includes(variable)) {
			continue;
		}
		const loop = scope.block as AnyNode;
		if (loop.type !== 'ForOfStatement' && loop.type !== 'ForInStatement') {
			continue;
		}
		if (loop.right.start <= use && use < loop.right.end) {
			return true;
		}
	}
	return false;
}
