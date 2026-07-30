# Spir@Learn

Educational content for learning to program, powered by
[Docusaurus](https://docusaurus.io/).

> Measure progress by comprehension, not production.

## Getting Started

1. Clone this repository
2. Run `npm install`
3. Run `npm start` to launch the dev server

## Available Scripts

| Script                      | What it does                                              |
| --------------------------- | --------------------------------------------------------- |
| `npm start`                 | Launch Docusaurus dev server                              |
| `npm run build`             | Build static site for deployment                          |
| `npm run typecheck`         | TypeScript type check (tsc --noEmit)                      |
| `npm test`                  | Run vitest test suite                                     |
| `npm run lint`              | Run all linters                                           |
| `npm run format`            | Auto-format all files                                     |
| `npm run validate`          | typecheck + format check + lint + test (CI gate)          |
| `npm run lint:js`           | ESLint on JS/MJS/JSX/TS/TSX files                         |
| `npm run lint:md`           | markdownlint on Markdown files                            |
| `npm run lint:mdx`          | ESLint + MDX plugin on MDX files                          |
| `npm run lint:names`        | ls-lint for file/directory naming                         |
| `npm run lint:spelling`     | cspell spell-check across all content                     |
| `npm run check:governance`  | Governance-docs checker (links, roster, claims, headings) |
| `npm run repo:facts`        | Emit measured repo facts (the oracle)                     |
| `npm run typecheck:scripts` | Type-check `scripts/` (checked-JS project)                |
| `npm run test:hooks`        | Behavioral suites for the `.claude` tool hooks            |

## Architecture

This repository is a [Docusaurus](https://docusaurus.io/) site wrapping two
kinds of source:

- **Curriculum content** under `spiralearn/` — one directory per curriculum (see
  [§ Content Structure](#content-structure) below).
- **Interactive study tooling** under `src/` — Docusaurus pages and plugins
  (`src/pages/`, `src/plugins/`), and the study-lens / embody engine libraries
  under `src/lib/`.

Repo-level tooling lives in `scripts/` (lint orchestration, the governance
checker, and the measured-facts oracle — see `scripts/README.md`) and
`eslint-rules/` (local ESLint rules with their tests). Internal conventions,
module boundaries, and the development workflow live in [DEV.md](./DEV.md);
agent governance lives in [AGENTS.md](./AGENTS.md) and
[AGENTS.principal.md](./AGENTS.principal.md), routed by
[CLAUDE.md](./CLAUDE.md).

## Content Structure

Each curriculum lives in its own directory under `spiralearn/`:

```text
spiralearn/
  welcome-to-frogramming/   (syllabus meta — README, ontology, pedagogy, etc.;
                             chapter content migrates here from welcome-to-programming/)
  welcome-to-programming/   (DEPRECATED — chapter content awaiting migration;
                             unrouted in docusaurus.config.ts; do not add new content)
    0-what-is-programming/
    1-devs/
    2-devs-computers/
    3-devs-computers-users/
    4-devs-computers-users-agents/
  welcome-to-algorithms/
    5-devs-computers-users-agents-algorithms/
    6-devs-computers-users-agents-algorithms-complexity/
```

## Conventions

- **Directories and files**: `kebab-case`
- **Python files**: `snake_case` also accepted
- **Markdown**: `.md` for plain content, `.mdx` for content with React
  components
- **JS/MJS**: isolated single-file study programs
- **Python**: isolated single-file study programs (4-space indent)

## Study Lenses

Study lens components are published as npm packages and imported directly in MDX
files:

```mdx
import { CodeLens } from '@codeschoolinabox/code-lens';

<CodeLens src="./example.js" />
```

## License

MIT
