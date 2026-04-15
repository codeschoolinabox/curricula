/**
 * @file Extracts a `@study-lens` directive from a `.js` file's
 * leading comment block.
 *
 * The leading comment block is the contiguous prefix of the file made
 * up of blank lines, line comments (`// ...`), and block comments
 * (`/* ... *\/`, `/** ... *\/`). The first non-blank, non-comment
 * statement (e.g. `'use strict';`, `const x = 1;`, a shebang) ends
 * the block — the directive MUST appear before any code.
 *
 * Within the block, an `@study-lens` tag may declare a lens name and
 * an optional inline JSON config body. Malformed JSON is a loud
 * failure (throws with the file path); it matches the cascade
 * resolver's behavior for malformed `lenses.json` files.
 */

export type StudyLensDirective = Readonly<{
	lens: string;
	lensConfig?: Readonly<Record<string, unknown>>;
}>;

/**
 * Parses the leading-comment directive from a file's content.
 *
 * @param fileContent - The full text of the file.
 * @param absPath - Absolute path used for error messages when the
 *   directive's JSON body fails to parse.
 * @returns The parsed directive, or `null` if no `@study-lens` tag
 *   appears in the leading comment block.
 * @throws If the directive is present AND declares a JSON body AND
 *   the body is syntactically invalid JSON.
 */
function parseStudyLensDirective(
	fileContent: string,
	absPath: string,
): StudyLensDirective | null {
	const block = extractLeadingCommentBlock(fileContent);
	if (block === '') return null;

	const stripped = stripCommentMarkers(block);

	const tagMatch = stripped.match(/@study-lens\s+(\S+)([\s\S]*)$/);
	if (tagMatch === null) return null;

	const lens = tagMatch[1]!;
	const rest = tagMatch[2]!.trim();
	if (rest === '') {
		return { lens };
	}

	try {
		const lensConfig = JSON.parse(rest) as Record<string, unknown>;
		return { lens, lensConfig };
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : String(cause);
		throw new Error(
			`Malformed @study-lens config JSON in ${absPath}: ${message}`,
		);
	}
}

/**
 * Collects the contiguous prefix of the file made of blank lines and
 * comment forms (line comments `//` and block comments `/*` / `/**`).
 * Stops at the first non-blank, non-comment line.
 */
function extractLeadingCommentBlock(content: string): string {
	const lines = content.split('\n');
	const collected: Array<string> = [];
	let i = 0;
	while (i < lines.length) {
		const line = lines[i]!;
		const trimmed = line.trim();
		if (trimmed === '') {
			collected.push(line);
			i++;
			continue;
		}
		if (trimmed.startsWith('//')) {
			collected.push(line);
			i++;
			continue;
		}
		if (trimmed.startsWith('/*')) {
			collected.push(line);
			// If the opening line also closes the block, done with this comment.
			if (trimmed.includes('*/')) {
				i++;
				continue;
			}
			i++;
			while (i < lines.length) {
				collected.push(lines[i]!);
				if (lines[i]!.includes('*/')) {
					i++;
					break;
				}
				i++;
			}
			continue;
		}
		break;
	}
	return collected.join('\n');
}

/**
 * Removes comment markers so the resulting text can be regex-matched
 * for the `@study-lens` tag. Handles line comments (`//`), JSDoc
 * block openers (`/**`, `/*`), JSDoc line prefixes (` * `), and
 * block closers (`*\/`).
 */
function stripCommentMarkers(block: string): string {
	return block
		.replace(/\/\*\*?/g, '')
		.replace(/\*\//g, '')
		.split('\n')
		.map((line) =>
			line.replace(/^\s*\*\s?/, '').replace(/^\s*\/\/\s?/, ''),
		)
		.join('\n');
}

export default parseStudyLensDirective;
