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
export default function parseStudyLensDirective(
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

	const lens = tagMatch[1]!;
	const rest = tagMatch[2]!.trim();

	let directive: StudyLensDirective;
	if (rest === '') {
		directive = { lens };
	} else {
		try {
			const lensConfig = JSON.parse(rest) as Record<string, unknown>;
			directive = { lens, lensConfig };
		} catch (cause) {
			const message = cause instanceof Error ? cause.message : String(cause);
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
	const kinds: LineKind[] = [];
	let inBlockComment = false;
	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i]!.trim();
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
		if (i === 0 && trimmed.startsWith('#!')) {
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
		for (let i = 0; i < kinds.length; i++) {
			if (kinds[i] === kind) return i;
		}
		return -1;
	}
	for (let i = kinds.length - 1; i >= 0; i--) {
		if (kinds[i] === kind) return i;
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
	const forms: CommentForm[] = [];
	let lineRunStart = -1;
	let i = start;
	while (i < end) {
		const k = kinds[i]!;
		if (k === 'line-comment') {
			if (lineRunStart < 0) lineRunStart = i;
			i++;
			continue;
		}
		if (lineRunStart >= 0) {
			forms.push({
				kind: 'line-run',
				startLine: lineRunStart,
				endLine: i - 1,
			});
			lineRunStart = -1;
		}
		if (k === 'single-line-block-comment') {
			forms.push({ kind: 'block', startLine: i, endLine: i });
			i++;
			continue;
		}
		if (k === 'block-comment-open') {
			let j = i + 1;
			while (j < end && kinds[j] !== 'block-comment-close') j++;
			if (j < end) {
				forms.push({ kind: 'block', startLine: i, endLine: j });
				i = j + 1;
				continue;
			}
			// Unterminated block (shouldn't happen inside a well-formed
			// leading/trailing region; fall through).
		}
		i++;
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
): string[] {
	const before = lines.slice(0, form.startLine);
	const after = lines.slice(form.endLine + 1);
	if (isLeading) {
		let i = 0;
		while (i < after.length && after[i]!.trim() === '') i++;
		return [...before, ...after.slice(i)];
	}
	let j = before.length - 1;
	while (j >= 0 && before[j]!.trim() === '') j--;
	return [...before.slice(0, j + 1), ...after];
}

export type StudyLensDirective = Readonly<{
	lens: string;
	lensConfig?: Readonly<Record<string, unknown>>;
}>;

export type StudyLensDirectiveMatch = Readonly<{
	directive: StudyLensDirective;
	strippedCode: string;
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
	kind: 'line-run' | 'block';
	startLine: number; // inclusive, 0-based
	endLine: number; // inclusive
}>;
