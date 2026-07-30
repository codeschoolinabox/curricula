/**
 * The roster check: DEV.md's sub-model dispatch table against the reviewer
 * agent frontmatters (scripts/README.md § Scope of each check). Attribution
 * follows DEV.md's own rule — "if they ever diverge, the frontmatter wins" —
 * so parity findings attribute to DEV.md at the offending row's line;
 * name-vs-stem findings attribute to the agent file. Non-reviewer agent
 * files are a named skip (covered by claims and headings only).
 *
 * @typedef {import('./types.mjs').ParsedDocument} ParsedDocument
 * @typedef {import('./types.mjs').RosterRow} RosterRow
 * @typedef {import('./types.mjs').Finding} Finding
 */

const DISPATCH_HEADING = 'Sub-model dispatch';
const REVIEWER_PATH = /^\.claude\/agents\/(ar-[^/]+)\.md$/;

/**
 * @param {ParsedDocument[]} parsedDocs
 * @returns {Finding[]}
 */
export default function checkRoster(parsedDocs) {
	const dev = parsedDocs.find((d) => d.path === 'DEV.md');
	if (!dev) return [parseFailure('DEV.md')];

	const table = readDispatchTable(dev);
	if (table === null) return [parseFailure(dev.path)];

	/** @type {Finding[]} */
	const findings = [...table.rowFindings];
	const reviewers = parsedDocs
		.map((doc) => ({ doc, match: REVIEWER_PATH.exec(doc.path) }))
		.filter(({ match }) => match !== null)
		.map(({ doc, match }) => readReviewerFrontmatter(doc, String(match?.[1])));

	for (const reviewer of reviewers) {
		if (reviewer.malformed) {
			findings.push(
				finding(
					reviewer.path,
					null,
					`malformed frontmatter in ${reviewer.path} — expected a closed --- block declaring name:`,
				),
			);
			continue;
		}
		if (reviewer.name !== reviewer.stem) {
			findings.push(
				finding(
					reviewer.path,
					reviewer.nameLine,
					`frontmatter name "${reviewer.name}" differs from the file stem "${reviewer.stem}"`,
				),
			);
		}
	}

	const byStem = new Map(
		reviewers.filter((r) => !r.malformed).map((r) => [r.stem, r]),
	);
	for (const row of table.rows) {
		const reviewer = byStem.get(row.name);
		if (!reviewer) {
			findings.push(
				finding(
					dev.path,
					row.line,
					`table row ${row.name} has no matching agent file`,
				),
			);
			continue;
		}
		if (reviewer.model !== row.model) {
			findings.push(
				finding(
					dev.path,
					row.line,
					`model parity broken for ${row.name}: table says ${row.model ?? 'inherit'}, frontmatter says ${reviewer.model ?? 'inherit'} — the frontmatter wins`,
				),
			);
		}
	}

	const rowNames = new Set(table.rows.map((row) => row.name));
	for (const reviewer of reviewers) {
		if (!reviewer.malformed && !rowNames.has(reviewer.stem)) {
			findings.push(
				finding(
					dev.path,
					table.headingLine,
					`agent file ${reviewer.stem} has no row in the dispatch table`,
				),
			);
		}
	}

	findings.push(...checkSectionFraming(dev));
	return findings;
}

/**
 * @param {ParsedDocument} dev
 * @returns {{ rows: (RosterRow & { line: number })[], rowFindings: Finding[], headingLine: number } | null}
 *   null = ROSTER PARSE FAILURE (missing heading or zero table rows).
 */
function readDispatchTable(dev) {
	const heading = dev.headings.find((h) => h.text === DISPATCH_HEADING);
	if (!heading) return null;
	const next = dev.headings.find((h) => h.line > heading.line);
	const end = next ? next.line - 1 : dev.lines.length;

	/** @type {(RosterRow & { line: number })[]} */
	const rows = [];
	/** @type {Finding[]} */
	const rowFindings = [];
	const seen = new Set();
	let pipeLines = 0;
	for (let i = heading.line; i < end; i += 1) {
		const line = dev.lines[i];
		if (!/^\s*\|/.test(line)) continue;
		pipeLines += 1;
		if (pipeLines === 1) continue;
		if (/^\s*\|[\s|:-]+\|\s*$/.test(line)) continue;
		const cells = line.split('|').map((cell) => cell.trim());
		const arCell = cells[1] ?? '';
		const modelCell = (cells[3] ?? '').replaceAll('`', '').trim();
		const arMatch = /^AR-(\d+)\b/.exec(arCell);
		if (!arMatch) {
			rowFindings.push(
				finding(
					dev.path,
					i + 1,
					`dispatch row does not name an AR: "${arCell}"`,
				),
			);
			continue;
		}
		const name = `ar-${arMatch[1]}`;
		if (seen.has(name)) {
			rowFindings.push(
				finding(dev.path, i + 1, `duplicate dispatch row for ${name}`),
			);
			continue;
		}
		seen.add(name);
		rows.push({
			name,
			model: modelCell === 'inherit' || modelCell === '' ? null : modelCell,
			line: i + 1,
		});
	}
	if (rows.length === 0 && rowFindings.length === 0) return null;
	return { rows, rowFindings, headingLine: heading.line };
}

/**
 * Frontmatter keys are read at top level only — folded multi-line scalars
 * (indented continuation lines) pass through untouched.
 *
 * @param {ParsedDocument} doc
 * @param {string} stem
 * @returns {{ path: string, stem: string, name: string, nameLine: number, model: string | null, malformed: boolean }}
 */
function readReviewerFrontmatter(doc, stem) {
	const malformed = {
		path: doc.path,
		stem,
		name: '',
		nameLine: 0,
		model: null,
		malformed: true,
	};
	if (doc.lines[0] !== '---') return malformed;
	const close = doc.lines.indexOf('---', 1);
	if (close === -1) return malformed;

	let name = null;
	let nameLine = 0;
	let model = null;
	for (let i = 1; i < close; i += 1) {
		const match = /^([a-z]+):\s*(.*)$/.exec(doc.lines[i]);
		if (!match) continue;
		if (match[1] === 'name') {
			name = match[2].trim();
			nameLine = i + 1;
		}
		if (match[1] === 'model') model = match[2].trim() || null;
	}
	if (name === null) return malformed;
	return { path: doc.path, stem, name, nameLine, model, malformed: false };
}

/**
 * Every `### AR-N:` section opens with a Trigger line and carries a Provide
 * line — the two lines the implementing agent owns at each gate.
 *
 * @param {ParsedDocument} dev
 * @returns {Finding[]}
 */
function checkSectionFraming(dev) {
	/** @type {Finding[]} */
	const findings = [];
	const sections = dev.headings.filter((h) => /^AR-\d+:/.test(h.text));
	for (const section of sections) {
		const next = dev.headings.find((h) => h.line > section.line);
		const end = next ? next.line - 1 : dev.lines.length;
		const body = dev.lines.slice(section.line, end);
		const firstProse = body.find((line) => line.trim() !== '');
		if (!firstProse || !firstProse.startsWith('**Trigger:**')) {
			findings.push(
				finding(
					dev.path,
					section.line,
					`section ${section.text} does not open with a **Trigger:** line`,
				),
			);
		}
		if (!body.some((line) => line.startsWith('**Provide to agent:**'))) {
			findings.push(
				finding(
					dev.path,
					section.line,
					`section ${section.text} has no **Provide to agent:** line`,
				),
			);
		}
	}
	return findings;
}

/**
 * @param {string} path
 * @returns {Finding}
 */
function parseFailure(path) {
	return finding(
		path,
		null,
		'ROSTER PARSE FAILURE — the Sub-model dispatch heading or its table rows could not be read; an empty roster must never pass',
	);
}

/**
 * @param {string} path
 * @param {number | null} line
 * @param {string} message
 * @returns {Finding}
 */
function finding(path, line, message) {
	return { path, line, check: 'roster', severity: 'error', message };
}
