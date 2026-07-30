#!/usr/bin/env node
/**
 * The governance checker's thin entry (scripts/DOCS.md § Phases): Load and
 * Resolve own every filesystem/git/package.json touch; the checks are pure.
 * Exit 1 on any error-severity finding; `--migration` mode exits 0 only on a
 * successful run.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import checkClaims from './lib/check-governance/claims.mjs';
import isCorpusPath from './lib/check-governance/corpus.mjs';
import globMatch from './lib/check-governance/glob-match.mjs';
import checkHeadings from './lib/check-governance/headings.mjs';
import checkLinks from './lib/check-governance/links.mjs';
import parseMigrationArgs from './lib/check-governance/migration-args.mjs';
import parseDocument from './lib/check-governance/parse.mjs';
import presenceDiff from './lib/check-governance/presence-diff.mjs';
import formatReport from './lib/check-governance/report.mjs';
import resolveFrom from './lib/check-governance/resolve-from.mjs';
import checkRoster from './lib/check-governance/roster.mjs';
import resolveUtilsAlias from './lib/check-governance/utils-alias.mjs';

/** @typedef {import('./lib/check-governance/types.mjs').CorpusDocument} CorpusDocument */
/** @typedef {import('./lib/check-governance/types.mjs').ParsedDocument} ParsedDocument */
/** @typedef {import('./lib/check-governance/types.mjs').RepoSnapshot} RepoSnapshot */

if (process.argv[2] === '--migration') {
	runMigration(process.argv.slice(3));
} else {
	runChecker();
}

function runChecker() {
	const corpusPaths = loadCorpusPaths();
	const documents = corpusPaths.map(readDocument);
	const parsed = documents.map(parseDocument);
	const baselineParsed = loadBaselineDocuments().map(parseDocument);
	const snapshot = buildSnapshot(parsed);

	const findings = [
		...checkLinks(parsed, snapshot),
		...checkRoster(parsed),
		...checkClaims(parsed, snapshot),
		...checkHeadings(parsed, baselineParsed),
	];
	const { text, exitCode } = formatReport(findings, corpusPaths);
	console.log(text);
	process.exit(exitCode);
}

/**
 * @param {string[]} args
 */
function runMigration(args) {
	try {
		const { sourcePath, ref, destinations } = parseMigrationArgs(args);
		const sourceContent = gitShow(ref, sourcePath);
		const sourceTerms = parseDocument({
			path: sourcePath,
			content: sourceContent,
		}).terms;
		const destinationTerms = destinations.flatMap(
			(path) => parseDocument(readDocument(path)).terms,
		);
		const losses = presenceDiff(sourceTerms, destinationTerms);
		if (losses.length === 0) {
			console.log('no candidate losses');
		}
		for (const loss of losses) {
			console.log(
				`${loss.kind} "${loss.term}" — ${loss.sourcePath}:${loss.line}`,
			);
		}
		process.exit(0);
	} catch (error) {
		console.error(String(error instanceof Error ? error.message : error));
		process.exit(1);
	}
}

/**
 * Load phase: root *.md plus the infrastructure walks, fail-closed — an
 * unreadable path or a glob that matches nothing dies loudly.
 *
 * @returns {string[]} Corpus paths in report order.
 */
function loadCorpusPaths() {
	const rootDocs = readdirSync('.')
		.filter((name) => name.endsWith('.md') && statSync(name).isFile())
		.filter(isCorpusPath)
		.sort();
	/** @type {string[]} */
	let claudeDocs = [];
	/** @type {string[]} */
	let scriptsDocs = [];
	try {
		claudeDocs = walkMarkdown('.claude').filter(isCorpusPath).sort();
		scriptsDocs = walkMarkdown('scripts').filter(isCorpusPath).sort();
	} catch (error) {
		die(`corpus fail-closed: infrastructure walk failed: ${String(error)}`);
	}
	if (rootDocs.length === 0) die('corpus fail-closed: no root *.md found');
	if (claudeDocs.length === 0) {
		die('corpus fail-closed: .claude/**/*.md matched nothing');
	}
	if (scriptsDocs.length === 0) {
		die('corpus fail-closed: scripts/**/*.md matched nothing');
	}
	return [...rootDocs, ...claudeDocs, ...scriptsDocs];
}

/**
 * @param {string} directory
 * @returns {string[]}
 */
function walkMarkdown(directory) {
	/** @type {string[]} */
	const found = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = `${directory}/${entry.name}`;
		if (entry.isDirectory()) found.push(...walkMarkdown(path));
		else if (entry.name.endsWith('.md')) found.push(path);
	}
	return found;
}

/**
 * @param {string} path
 * @returns {CorpusDocument}
 */
function readDocument(path) {
	try {
		return { path, content: readFileSync(path, 'utf8') };
	} catch (error) {
		die(`corpus fail-closed: cannot read ${path}: ${String(error)}`);
		throw error;
	}
}

/**
 * The baseline corpus as it reads at HEAD — enumerated from HEAD's own tree
 * so documents deleted from the working tree still contribute their
 * headings.
 *
 * @returns {CorpusDocument[]}
 */
function loadBaselineDocuments() {
	const listing = git(['ls-tree', '-r', '--name-only', 'HEAD']);
	return listing
		.split('\n')
		.filter((path) => path !== '' && isCorpusPath(path))
		.map((path) => ({ path, content: gitShow('HEAD', path) }));
}

/**
 * @param {string} ref
 * @param {string} path
 * @returns {string}
 */
function gitShow(ref, path) {
	return git(['show', `${ref}:${path}`]);
}

/**
 * @param {string[]} args
 * @returns {string}
 */
function git(args) {
	return execFileSync('git', args, { encoding: 'utf8' });
}

/**
 * Resolve phase: materialize plain data for exactly the targets the parsed
 * documents reference. Over-collection is harmless (an existence probe on a
 * non-path is false); under-collection would read as a false "does not
 * exist". A `.js`/`.jsx` reference exists when its `.ts`/`.tsx` sibling
 * does (the NodeNext import convention).
 *
 * @param {ParsedDocument[]} parsedDocs
 * @returns {RepoSnapshot}
 */
function buildSnapshot(parsedDocs) {
	/** @type {Record<string, {scripts?: Record<string, string>}>} */
	const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
	const npmScripts = Object.keys(packageJson.scripts ?? {});
	const binTools = readdirSync('node_modules/.bin');

	/** @type {Set<string>} */
	const candidates = new Set();
	/** @type {Set<string>} */
	const fragmentTargets = new Set();
	/** @type {Set<string>} */
	const globTokens = new Set();

	for (const doc of parsedDocs) {
		for (const link of doc.links) {
			const target = link.target;
			if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
			if (target.startsWith('/') || target.startsWith('#')) continue;
			if (target.includes(' ')) continue;
			const hashAt = target.indexOf('#');
			const relative = hashAt === -1 ? target : target.slice(0, hashAt);
			const resolved = resolveFrom(doc.path, relative);
			candidates.add(resolved);
			if (hashAt !== -1) fragmentTargets.add(resolved);
		}
		for (const token of doc.tokens) {
			for (const word of token.text.split(/\s+/)) {
				if (word === '' || word.startsWith('~') || word.startsWith('/')) {
					continue;
				}
				if (/[*?]/.test(word)) {
					globTokens.add(word);
					continue;
				}
				const aliasTarget = resolveUtilsAlias(word);
				if (aliasTarget !== null) {
					candidates.add(aliasTarget);
					continue;
				}
				if (word.startsWith('./node_modules/')) {
					candidates.add(word.slice(2));
					continue;
				}
				candidates.add(resolveFrom(doc.path, word));
				candidates.add(word);
			}
		}
	}

	/** @type {Set<string>} */
	const existingPaths = new Set();
	for (const candidate of candidates) {
		const clean = candidate.replace(/\/$/, '');
		if (clean === '') continue;
		if (existsWithSibling(clean)) existingPaths.add(clean);
	}

	/** @type {Record<string, string[] | null>} */
	const headingsByPath = {};
	for (const target of fragmentTargets) {
		const clean = target.replace(/\/$/, '');
		if (!existingPaths.has(clean)) continue;
		headingsByPath[clean] = markdownHeadingsOf(clean);
	}

	const tracked = git(['ls-files']).split('\n');
	/** @type {Set<string>} */
	const matchingGlobs = new Set();
	for (const pattern of globTokens) {
		if (tracked.some((path) => path !== '' && globMatch(pattern, path))) {
			matchingGlobs.add(pattern);
		}
	}

	const ignoredPaths = ignoredAmong(
		[...candidates]
			.map((candidate) => candidate.replace(/\/$/, ''))
			.filter((candidate) => candidate !== '' && !existingPaths.has(candidate)),
	);

	return {
		npmScripts,
		binTools,
		existingPaths,
		headingsByPath,
		matchingGlobs,
		ignoredPaths,
	};
}

/**
 * Missing candidates that git would ignore — machine-generated artifacts the
 * claims check downgrades to advisory (the named gitignored class).
 *
 * @param {string[]} missing
 * @returns {Set<string>}
 */
function ignoredAmong(missing) {
	/** @type {Set<string>} */
	const ignored = new Set();
	if (missing.length === 0) return ignored;
	try {
		const out = execFileSync('git', ['check-ignore', '--stdin', '-z'], {
			encoding: 'utf8',
			input: missing.join('\0'),
		});
		for (const entry of out.split('\0')) {
			if (entry !== '') ignored.add(entry);
		}
	} catch (error) {
		if (!isCheckIgnoreMiss(error)) throw error;
	}
	return ignored;
}

/**
 * `git check-ignore` exits 1 when NO path is ignored — a normal outcome, not
 * a failure.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
function isCheckIgnoreMiss(error) {
	return (
		typeof error === 'object' &&
		error !== null &&
		'status' in error &&
		error.status === 1
	);
}

/**
 * @param {string} path
 * @returns {boolean}
 */
function existsWithSibling(path) {
	if (existsSync(path)) return true;
	if (path.endsWith('.js')) return existsSync(`${path.slice(0, -3)}.ts`);
	if (path.endsWith('.jsx')) return existsSync(`${path.slice(0, -4)}.tsx`);
	return false;
}

/**
 * @param {string} path
 * @returns {string[] | null}
 */
function markdownHeadingsOf(path) {
	if (!path.endsWith('.md') || !statSync(path).isFile()) return null;
	const parsed = parseDocument({ path, content: readFileSync(path, 'utf8') });
	return parsed.headings.map((heading) => heading.text);
}

/**
 * @param {string} message
 * @returns {never}
 */
function die(message) {
	console.error(message);
	process.exit(1);
}
