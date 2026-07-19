import { spawnSync } from 'node:child_process';

const steps = ['lint:js', 'lint:md', 'lint:mdx', 'lint:names', 'lint:spelling'];

const runStep = (step) => {
	const result = spawnSync('npm', ['run', '--silent', step], {
		stdio: 'inherit',
	});
	return result.status ?? 1;
};

const failures = steps.filter((step) => runStep(step) !== 0);

if (failures.length > 0) {
	console.error(`\nlint failed: ${failures.join(', ')}`);
	process.exit(1);
}
