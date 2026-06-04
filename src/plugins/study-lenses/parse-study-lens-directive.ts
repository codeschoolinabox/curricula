/**
 * @file Extracts a `@study-lens` directive from a `.js` file's
 * leading OR trailing comment block, and returns the file content
 * with the directive-carrying comment stripped.
 *
 * The directive may appear in one of two boundary regions:
 *
 * - **Leading comment block** — the contiguous prefix of the file
 *   made of blank lines, a shebang, line comments, and block
 *   comments, up to the first non-blank/non-comment/non-shebang line.
 * - **Trailing comment block** — the mirror region at the file's
 *   end: blank lines, line comments, and block comments after the
 *   last non-comment statement.
 *
 * Middle-of-file placement is NOT supported — reliably distinguishing
 * a directive tag in a real comment from the same characters inside
 * a string/regex/template literal would require a JS tokenizer.
 *
 * If a directive appears in BOTH blocks, the parser throws
 * ambiguous-placement (with the file path) so authors get an
 * immediate build error rather than a silent precedence guess.
 * Malformed JSON in the directive body also throws with the file
 * path — matches the cascade resolver's loud-failure convention.
 *
 * Algorithm: single top-down pass classifies each line (blank,
 * shebang, line-comment, block-comment-open/interior/close,
 * single-line-block-comment, or code). Forms are enumerated
 * line-indexed (not via a flat stripped string); the matched form's
 * line range is the strip range. Blank-line collapsing removes
 * blanks immediately between the stripped form and the preserved
 * code body, but preserves blanks on the file-edge side of the form
 * (so the file's trailing newline and any top-of-file padding stay
 * intact when appropriate).
 */

export type StudyLensDirective = Readonly<{
	readonly lens: string;
	readonly lensConfig?: Readonly<Record<string, unknown>>;
}>;

export type StudyLensDirectiveMatch = Readonly<{
	readonly directive: StudyLensDirective;
	readonly strippedCode: string;
}>;

type LineKind =
	| 'blank'
	| 'line-comment'
	| 'block-comment-open'
	| 'block-comment-interior'
	| 'block-comment-close'
	| 'single-line-block-comment'
	| 'shebang'
	| 'code';

type CommentForm = Readonly<{
	readonly kind: 'line-run' | 'block';
	readonly startLine: number; // inclusive, 0-based
	readonly endLine: number; // inclusive
}>;

/**
 * Parses the `@study-lens` directive from a file's leading or
 * trailing comment block, and returns both the parsed directive and
 * the file content with the directive-carrying comment stripped.
 *
 * @param fileContent - The full text of the file.
 * @param absPath - Absolute path used in error messages when the
 *   directive's JSON body fails to parse or the directive appears
 *   in both blocks.
 * @returns A `{directive, strippedCode}` match, or `null` if no
 *   `@study-lens` tag appears in either boundary block.
 * @throws If the directive appears in both blocks (ambiguous
 *   placement) OR the directive's JSON body is syntactically invalid.
 */
function parseStudyLensDirective(
	fileContent: string,
	absPath: string,
): StudyLensDirectiveMatch | null {
	const lines = fileContent.split('\n');
	const kinds = classifyLines(lines);

	const firstCode = indexOfKind(kinds, 'code', 'forward');
	const lastCode = indexOfKind(kinds, 'code', 'backward');

	// Leading block covers [0, firstCode). If there's no code at all,
	// the whole file is treated as the leading block (directive-only
	// files are valid).
	const leadingEnd = firstCode === -1 ? lines.length : firstCode;
	const leadingForms = enumerateForms(kinds, 0, leadingEnd);

	// Trailing block covers (lastCode, lines.length). Empty when the
	// file has no code at all.
	const trailingForms =
		lastCode === -1
			? ([] as ReadonlyArray<CommentForm>)
			: enumerateForms(kinds, lastCode + 1, lines.length);

	const leadingMatch = leadingForms.find((f) => formContainsTag(lines, f));
	const trailingMatch = trailingForms.find((f) => formContainsTag(lines, f));

	if (leadingMatch !== undefined && trailingMatch !== undefined) {
		throw new Error(
			`Ambiguous @study-lens placement in ${absPath}: directive ` +
				`appears in both leading and trailing comment blocks`,
		);
	}

	const winner = leadingMatch ?? trailingMatch;
	if (winner === undefined) return null;
	const isLeading = leadingMatch !== undefined;

	const stripped = stripFormMarkers(lines, winner);
	const tagMatch = stripped.match(/@study-lens\s+(\S+)([\s\S]*)$/);
	if (tagMatch === null) return null;

	const lens = tagMatch[1];
	const rest = tagMatch[2].trim();

	let directive: StudyLensDirective;
	if (rest === '') {
		directive = { lens };
	} else {
		try {
			const lensConfig = JSON.parse(rest) as Record<string, unknown>;
			directive = { lens, lensConfig };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(
				`Malformed @study-lens config JSON in ${absPath}: ${message}`,
			);
		}
	}

	const strippedCode = stripFormFromLines(lines, winner, isLeading).join('\n');
	return { directive, strippedCode };
}

/** Classifies each line of the file. Tracks block-comment state. */
function classifyLines(lines: ReadonlyArray<string>): ReadonlyArray<LineKind> {
	const kinds: readonly LineKind[] = [];
	let inBlockComment = false;
	for (const [index, line] of lines.entries()) {
		const trimmed = line.trim();
		if (inBlockComment) {
			if (trimmed.includes('*/')) {
				inBlockComment = false;
				kinds.push('block-comment-close');
			} else {
				kinds.push('block-comment-interior');
			}
			continue;
		}
		if (trimmed === '') {
			kinds.push('blank');
			continue;
		}
		if (index === 0 && trimmed.startsWith('#!')) {
			kinds.push('shebang');
			continue;
		}
		if (trimmed.startsWith('//')) {
			kinds.push('line-comment');
			continue;
		}
		if (trimmed.startsWith('/*')) {
			if (trimmed.endsWith('*/') && trimmed.length >= 4) {
				kinds.push('single-line-block-comment');
			} else if (trimmed.includes('*/')) {
				// Line contains `*/` but doesn't end with it → code after the
				// close. Treat as code; we don't model mid-line structure.
				kinds.push('code');
			} else {
				inBlockComment = true;
				kinds.push('block-comment-open');
			}
			continue;
		}
		kinds.push('code');
	}
	return kinds;
}

function indexOfKind(
	kinds: ReadonlyArray<LineKind>,
	kind: LineKind,
	direction: 'forward' | 'backward',
): number {
	if (direction === 'forward') {
		for (const [index, kind_] of kinds.entries()) {
			if (kind_ === kind) return index;
		}
		return -1;
	}
	for (let index = kinds.length - 1; index >= 0; index--) {
		if (kinds[index] === kind) return index;
	}
	return -1;
}

/**
 * Enumerates discrete comment forms (line-runs or blocks) in the
 * given line range. Blank lines, shebangs, and code lines delimit
 * the forms but are not forms themselves.
 */
function enumerateForms(
	kinds: ReadonlyArray<LineKind>,
	start: number,
	end: number,
): ReadonlyArray<CommentForm> {
	const forms: readonly CommentForm[] = [];
	let lineRunStart = -1;
	let index = start;
	while (index < end) {
		const k = kinds[index];
		if (k === 'line-comment') {
			if (lineRunStart < 0) lineRunStart = index;
			index++;
			continue;
		}
		if (lineRunStart >= 0) {
			forms.push({
				kind: 'line-run',
				startLine: lineRunStart,
				endLine: index - 1,
			});
			lineRunStart = -1;
		}
		if (k === 'single-line-block-comment') {
			forms.push({ kind: 'block', startLine: index, endLine: index });
			index++;
			continue;
		}
		if (k === 'block-comment-open') {
			let index_ = index + 1;
			while (index_ < end && kinds[index_] !== 'block-comment-close') index_++;
			if (index_ < end) {
				forms.push({ kind: 'block', startLine: index, endLine: index_ });
				index = index_ + 1;
				continue;
			}
			// Unterminated block (shouldn't happen inside a well-formed
			// leading/trailing region; fall through).
		}
		index++;
	}
	if (lineRunStart >= 0) {
		forms.push({
			kind: 'line-run',
			startLine: lineRunStart,
			endLine: end - 1,
		});
	}
	return forms;
}

/**
 * Strips comment markers (`//`, `/*`, `/**`, leading ` * `, trailing
 * `*\/`) from a form's lines, producing a raw string suitable for
 * regex matching on the `@study-lens` tag.
 */
function stripFormMarkers(
	lines: ReadonlyArray<string>,
	form: CommentForm,
): string {
	return lines
		.slice(form.startLine, form.endLine + 1)
		.map((line) =>
			line
				.replace(/^\s*\/\*\*?/, '')
				.replace(/\*\/\s*$/, '')
				.replace(/^\s*\*\s?/, '')
				.replace(/^\s*\/\/\s?/, ''),
		)
		.join('\n');
}

function formContainsTag(
	lines: ReadonlyArray<string>,
	form: CommentForm,
): boolean {
	return stripFormMarkers(lines, form).includes('@study-lens');
}

/**
 * Removes the matched form's lines from the file. Also removes blank
 * lines that were immediately between the form and the preserved code
 * body (but keeps blanks on the opposite side, which sit at the file
 * edge and represent the trailing newline or top-of-file padding).
 */
function stripFormFromLines(
	lines: ReadonlyArray<string>,
	form: CommentForm,
	isLeading: boolean,
): readonly string[] {
	const before = lines.slice(0, form.startLine);
	const after = lines.slice(form.endLine + 1);
	if (isLeading) {
		let index = 0;
		while (index < after.length && after[index].trim() === '') index++;
		return [...before, ...after.slice(index)];
	}
	let index = before.length - 1;
	while (index >= 0 && before[index].trim() === '') index--;
	return [...before.slice(0, index + 1), ...after];
}

export default parseStudyLensDirective;
