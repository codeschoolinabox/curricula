# Contributing

Thank you for your interest in contributing!

## Quick Start

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes following our conventions (see DEV.md)
5. Run tests: `npm test`
6. Run full validation: `npm run validate`
7. Submit a pull request

## Development Guidelines

- Follow all conventions in
  [DEV.md § Codebase Conventions](./DEV.md#codebase-conventions)
- Maintain pure functional approach
- Add tests in a `tests/` subdirectory alongside source (see
  [DEV.md § Test Organization](./DEV.md#test-organization))
- Maintain `README.md` in every source directory (see
  [DEV.md § Directory Documentation Convention](./DEV.md#directory-documentation-convention))
- Update documentation as needed

Full conventions with rationale and examples: see [DEV.md](./DEV.md).

## Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Minimal code example reproducing the issue
- Expected vs actual behavior
- Your environment (Node version, OS)

## Pull Request Process

1. Run `npm run validate` (lint, typecheck, and tests must all pass)
2. Update relevant documentation
3. Ensure `README.md` is current in every modified directory
4. Follow existing code patterns
5. Keep commits focused and descriptive
6. Reference any related issues

## Code of Conduct

See [CODE-OF-CONDUCT.md](./CODE-OF-CONDUCT.md) for our community guidelines.

## Questions?

Open an issue for clarification or discussion about potential changes.

## License

By contributing, you agree that your contributions will be licensed under the
project's MIT License.
