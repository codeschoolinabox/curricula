#!/usr/bin/env node
/**
 * The measured-facts oracle's thin entry (scripts/DOCS.md § Measured-facts
 * oracle): Measure → Condense → Emit, with the slow-measurement cache read
 * through unless `--refresh`. Every process/fs/git touch lives here; the
 * pure functions live in lib/repo-facts/. Exits nonzero only on the
 * oracle's own operational failure — never because a measured number is
 * bad.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import condenseForeignDirt from './lib/repo-facts/condense-foreign-dirt.mjs';
import formatFacts from './lib/repo-facts/format-facts.mjs';
import parseTscOutput from './lib/repo-facts/parse-tsc-output.mjs';
import isStale from './lib/repo-facts/staleness.mjs';

/** @typedef {import('./lib/repo-facts/types.mjs').Measurement} Measurement */
/** @typedef {import('./lib/repo-facts/types.mjs').CacheRecord} CacheRecord */

const CACHE_DIR = '.claude/cache';
const CACHE_PATH = '.claude/cache/repo-facts.json';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

try {
	const refresh = process.argv.includes('--refresh');
	const measurements = [
		measureNodeVersion(),
		measureTsc(),
		measureMarkdownlint(refresh),
		measureHead(),
		measureForeignDirt(),
	];
	console.log(formatFacts(measurements, new Date().toISOString()));
	process.exit(0);
} catch (error) {
	console.error(String(error instanceof Error ? error.message : error));
	process.exit(1);
}

/**
 * @returns {Measurement}
 */
function measureNodeVersion() {
	const timestamp = new Date().toISOString();
	/** @type {{engines?: {node?: string}}} */
	const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
	const engines = packageJson.engines?.node ?? 'unset';
	const runningMajor = Number(process.version.slice(1).split('.')[0]);
	const requiredMajor = Number(/\d+/.exec(engines)?.[0] ?? '0');
	const inequality =
		runningMajor < requiredMajor ? ' — BELOW the engines minimum' : '';
	return {
		label: 'node version vs engines',
		command: 'node --version',
		value: `${process.version} vs engines "${engines}"${inequality}`,
		timestamp,
	};
}

/**
 * @returns {Measurement}
 */
function measureTsc() {
	const timestamp = new Date().toISOString();
	const run = runCommand(['npx', 'tsc', '--noEmit']);
	if (run.spawnFailed) {
		return failedMeasurement('tsc errors', 'npx tsc --noEmit', run, timestamp);
	}
	const { count, locations } = parseTscOutput(run.stdout);
	const value =
		count === 0 ? '0' : `${count}\n${locations.join('\n') || '(no locations)'}`;
	return { label: 'tsc errors', command: 'npx tsc --noEmit', value, timestamp };
}

/**
 * @param {boolean} refresh
 * @returns {Measurement}
 */
function measureMarkdownlint(refresh) {
	const timestamp = new Date().toISOString();
	const label = 'markdownlint errors (repo-wide)';
	const command = 'npm run lint:md';
	if (!refresh) {
		const cached = readCache();
		if (cached && !isStale(cached.measuredAt, timestamp, CACHE_MAX_AGE_MS)) {
			return {
				label,
				command,
				value: cached.value,
				timestamp: cached.measuredAt,
			};
		}
	}
	const run = runCommand(['npm', 'run', 'lint:md']);
	if (run.spawnFailed) return failedMeasurement(label, command, run, timestamp);
	const summary =
		/Summary: (\d+) error/.exec(run.stdout + run.stderr)?.[1] ?? null;
	const value =
		summary === null ? `no summary line found (exit ${run.status})` : summary;
	writeCache({ value, measuredAt: timestamp });
	return { label, command, value, timestamp };
}

/**
 * @returns {Measurement}
 */
function measureHead() {
	const timestamp = new Date().toISOString();
	const run = runCommand(['git', 'rev-parse', 'HEAD']);
	if (run.spawnFailed || run.stdout.trim() === '') {
		return failedMeasurement('HEAD', 'git rev-parse HEAD', run, timestamp);
	}
	return {
		label: 'HEAD',
		command: 'git rev-parse HEAD',
		value: run.stdout.trim(),
		timestamp,
	};
}

/**
 * @returns {Measurement}
 */
function measureForeignDirt() {
	const timestamp = new Date().toISOString();
	const run = runCommand(['git', 'status', '--porcelain']);
	if (run.spawnFailed) {
		return failedMeasurement(
			'foreign dirty files (working tree not yours until proven)',
			'git status --porcelain',
			run,
			timestamp,
		);
	}
	const lines = condenseForeignDirt(run.stdout);
	return {
		label: 'foreign dirty files (working tree not yours until proven)',
		command: 'git status --porcelain',
		value: lines.length === 0 ? 'clean' : lines.join('\n'),
		timestamp,
	};
}

/**
 * Run a producing command without throwing: nonzero exits are OUTPUT (tsc's
 * error-findings state), never exceptions; only spawn failure marks failure.
 *
 * @param {string[]} argv
 * @returns {{ stdout: string, stderr: string, status: number | null, spawnFailed: boolean }}
 */
function runCommand(argv) {
	try {
		const stdout = execFileSync(argv[0], argv.slice(1), {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		return { stdout, stderr: '', status: 0, spawnFailed: false };
	} catch (error) {
		const failure =
			/** @type {{stdout?: string, stderr?: string, status?: number | null, signal?: string | null, code?: string}} */ (
				error
			);
		if (
			(failure.status ?? null) === null &&
			(failure.signal ?? null) === null
		) {
			return {
				stdout: '',
				stderr: `spawn failed (${failure.code ?? 'unknown'})`,
				status: null,
				spawnFailed: true,
			};
		}
		return {
			stdout: failure.stdout ?? '',
			stderr: failure.stderr ?? '',
			status: failure.status ?? null,
			spawnFailed: false,
		};
	}
}

/**
 * A producing command that fails to run is still its measurement — never
 * omitted, never a zero.
 *
 * @param {string} label
 * @param {string} command
 * @param {{ stderr: string, status: number | null }} run
 * @param {string} timestamp
 * @returns {Measurement}
 */
function failedMeasurement(label, command, run, timestamp) {
	const head = run.stderr.split('\n')[0] ?? '';
	return {
		label,
		command,
		value: `FAILED TO RUN (exit ${run.status ?? 'spawn error'})${head ? `: ${head}` : ''}`,
		timestamp,
	};
}

/**
 * @returns {CacheRecord | null}
 */
function readCache() {
	try {
		const parsed = JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
		if (typeof parsed?.markdownlint?.value !== 'string') return null;
		return parsed.markdownlint;
	} catch {
		return null;
	}
}

/**
 * @param {CacheRecord} record
 */
function writeCache(record) {
	try {
		mkdirSync(CACHE_DIR, { recursive: true });
		const temp = `${CACHE_PATH}.tmp`;
		writeFileSync(temp, JSON.stringify({ markdownlint: record }, null, 1));
		renameSync(temp, CACHE_PATH);
	} catch {
		// cache is an optimization; failing to write one never fails the run
	}
}
