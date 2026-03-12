import { execSync } from 'node:child_process';

try {
  execSync('ruff --version', { stdio: 'pipe' });
} catch {
  console.warn(
    '\n⚠️  Ruff is not installed or not on PATH.',
    '\n   Python linting/formatting will not work.',
    '\n   Install: pip install ruff  (or: uv tool install ruff)',
    '\n   See: https://docs.astral.sh/ruff/installation/',
    '\n',
  );
}
