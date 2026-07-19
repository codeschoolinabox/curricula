/**
 * newspaper-order — enforce the file anatomy documented in DEV.md §"File
 * Anatomy: Newspaper Order": a function file reads top-down as
 *
 *   imports → main (`export default function`) → consts → helpers
 *
 * The rule engages ONLY on a "function file": one whose default export's
 * declaration is a `FunctionDeclaration` (`async` included). Files whose default
 * export is an object/identifier/literal/arrow — or that have no default export
 * (barrels, types) — are a no-op, so spine-object modules that assemble their
 * export from helpers defined above stay valid.
 *
 * Given a function file, three things are violations, each reported at the
 * offending node:
 *   - a top-level `function` declaration before main   (helper jumped the headline)
 *   - a top-level `const` before main                   (const above main)
 *   - a top-level `const` after any helper              (const sank below the helpers)
 *
 * The rule is intentionally NOT fixable: reordering top-level declarations would
 * have to carry their leading comments and blank-line grouping atomically, and a
 * wrong autofix silently reshuffles a file. Retrofits are done by hand.
 *
 * Out of scope, by design:
 *   - `let` / `var` at top level (DEV.md speaks only to `const` placement).
 *   - Named-export-wrapped declarations (`export function foo(){}`): the body
 *     node is an `ExportNamedDeclaration`, not a bare `FunctionDeclaration`, so
 *     it is skipped. In-repo this can't co-occur with a default-function main
 *     under `import/no-named-export`; the rule leans on that config rather than
 *     unwrapping.
 *   - Consts initialized to an arrow/function expression (`const f = () => …`)
 *     are treated structurally as consts, so one above main reports as a
 *     const-placement issue. Whether such a helper should instead be a `function`
 *     declaration is a separate convention, not this rule's concern.
 *   - Inter-const ordering (consts that reference each other stay the author's
 *     responsibility).
 *
 * @module newspaper-order
 */

export default {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Enforce newspaper order: imports → main (default-exported function) → consts → helpers.',
		},
		schema: [],
		messages: {
			helperAboveMain:
				"Helper 'function {{name}}' is above the default export. Newspaper order is main-first — move it below 'export default function'.",
			constAboveMain:
				"Constant '{{name}}' is above the default export. Constants live directly below main, above the helpers — move it below 'export default function'.",
			constAfterHelper:
				"Constant '{{name}}' appears below a helper. Constants live directly below main, above the helpers — move it above the first helper.",
		},
	},

	create(context) {
		const sourceCode = context.sourceCode ?? context.getSourceCode();

		return {
			Program(program) {
				const { body } = program;

				// Engage only on a "function file": the default export's
				// declaration is a FunctionDeclaration (async or not, named or
				// anonymous). Anything else — or no default export — is a no-op.
				const mainIndex = body.findIndex(
					(node) =>
						node.type === 'ExportDefaultDeclaration' &&
						node.declaration?.type === 'FunctionDeclaration',
				);
				if (mainIndex === -1) return;

				let sawHelperAfterMain = false;

				for (const [i, node] of body.entries()) {
					if (i === mainIndex) continue;

					if (node.type === 'FunctionDeclaration') {
						if (i < mainIndex) {
							// A bare top-level `function` declaration always has an
							// id (only `export default function()` is anonymous, and
							// that is main, skipped above) — so node.id is safe here.
							context.report({
								node: node.id,
								messageId: 'helperAboveMain',
								data: { name: node.id.name },
							});
						} else {
							sawHelperAfterMain = true;
						}
					} else if (
						node.type === 'VariableDeclaration' &&
						node.kind === 'const'
					) {
						// A plain identifier uses its name (getText would drag in a
						// `: Type` annotation); destructured (`{ a, b }`) and
						// multi-declarator (`K, J`) consts fall back to source text
						// so the message stays readable instead of 'undefined'.
						const name = node.declarations
							.map((declarator) =>
								declarator.id.type === 'Identifier'
									? declarator.id.name
									: sourceCode.getText(declarator.id),
							)
							.join(', ');
						if (i < mainIndex) {
							context.report({
								node,
								messageId: 'constAboveMain',
								data: { name },
							});
						} else if (sawHelperAfterMain) {
							context.report({
								node,
								messageId: 'constAfterHelper',
								data: { name },
							});
						}
					}
					// imports, type aliases/interfaces, named exports, etc. are
					// neither flagged nor phase markers — skipped.
				}
			},
		};
	},
};
