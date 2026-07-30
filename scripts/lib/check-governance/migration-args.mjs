/**
 * Argument parsing for `--migration <src>@<ref> <dest...>`: the source spec
 * splits on its LAST at-sign (a documented limitation for reflog-style refs
 * containing `@` — see scripts/README.md § Running).
 *
 * @param {string[]} args Everything after the `--migration` flag.
 * @returns {{ sourcePath: string, ref: string, destinations: string[] }}
 */
export default function parseMigrationArgs(args) {
	if (args.length < 2) {
		throw new Error(
			'usage: check-governance.mjs --migration <src>@<ref> <dest...>',
		);
	}
	const [spec, ...destinations] = args;
	const at = spec.lastIndexOf('@');
	if (at <= 0 || at === spec.length - 1) {
		throw new Error(
			`source spec "${spec}" must be <path>@<ref> with both halves non-empty`,
		);
	}
	return {
		sourcePath: spec.slice(0, at),
		ref: spec.slice(at + 1),
		destinations,
	};
}
