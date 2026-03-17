# Spir@Learn

Educational content for learning to program, powered by
[Docusaurus](https://docusaurus.io/).

> Measure progress by comprehension, not production.

## Getting Started

1. Clone this repository
2. Install [Ruff](https://docs.astral.sh/ruff/installation/) for Python
   linting (optional)
3. Run `npm install`
4. Run `npm start` to launch the dev server

## Available Scripts

| Script | What it does |
| --- | --- |
| `npm start` | Launch Docusaurus dev server |
| `npm run build` | Build static site for deployment |
| `npm run lint` | Run all linters |
| `npm run format` | Auto-format all files |
| `npm run validate` | Format check + full lint (runs in CI) |
| `npm run lint:js` | ESLint on JS/MJS/JSX files |
| `npm run lint:md` | markdownlint on Markdown files |
| `npm run lint:mdx` | ESLint + MDX plugin on MDX files |
| `npm run lint:py` | Ruff check on Python files |
| `npm run lint:names` | ls-lint for file/directory naming |
| `npm run lint:spelling` | cspell spell-check across all content |

## Content Structure

Each curriculum lives in its own directory under `spiralearn/`:

```text
spiralearn/
  welcome-to-programming/
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

Study lens components are published as npm packages and imported directly in
MDX files:

```mdx
import { CodeLens } from '@codeschoolinabox/code-lens';

<CodeLens src="./example.js" />
```

## License

MIT
