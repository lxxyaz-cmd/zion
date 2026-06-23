# Contributing to Zion

Thank you for considering a contribution to **Zion** — the industrial digital twin visualization library built on Three.js. This document explains how to get set up, what we expect from contributions, and how the review process works.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Report a Bug](#how-to-report-a-bug)
- [How to Request a Feature](#how-to-request-a-feature)
- [Development Setup](#development-setup)
- [Branch & Commit Conventions](#branch--commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Adding a New Component](#adding-a-new-component)
- [Writing Examples](#writing-examples)
- [License](#license)

---

## Code of Conduct

All participants are expected to be respectful and constructive. Harassment, dismissive comments, or personal attacks will not be tolerated. If you experience or witness unacceptable behavior, open an issue labeled `conduct`.

---

## How to Report a Bug

Before opening a new issue, search [existing issues](https://github.com/lxxyaz-cmd/zion/issues) to avoid duplicates.

When filing a bug report, include:

- **Zion version** (from `package.json`)
- **Three.js version**
- **Browser / Node version**
- **Minimal reproduction** — a code snippet or a link to a CodePen/JSFiddle that reproduces the problem
- **Expected vs. actual behavior**
- **Screenshots or console output** if applicable

Use the `bug` issue template.

---

## How to Request a Feature

Open an issue with the `enhancement` label. Describe:

1. The industrial use case or maintenance workflow that motivates the request
2. What API shape you'd expect (method names, options, return values)
3. Whether you're willing to implement it yourself

For large changes, open a discussion first to align on design before writing code.

---

## Development Setup

**Requirements:** Node.js ≥ 18, npm ≥ 9

```bash
git clone https://github.com/lxxyaz-cmd/zion.git
cd zion
npm install
npm run dev          # Vite dev server → http://localhost:5173
```

The dev server serves `examples/cooling-system/index.html` with hot reload. Edit files under `src/` and the page updates automatically.

```bash
npm run build        # Build library to dist/
npm test             # Run Vitest unit tests
npm run lint         # ESLint
```

---

## Branch & Commit Conventions

| Type | Prefix |
|------|--------|
| New feature | `feat/` |
| Bug fix | `fix/` |
| Documentation | `docs/` |
| Refactor | `refactor/` |
| Tests | `test/` |
| CI / tooling | `chore/` |

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(pump): add setTorque() method for torque-speed curve simulation
fix(tank): correct water mesh height when level is set to 0
docs(readme): update Quick Start import map for Three.js r178
```

Keep commits focused — one logical change per commit.

---

## Pull Request Process

1. **Fork** the repository and create your branch from `main`.
2. Run `npm test` and `npm run lint` — both must pass.
3. Add or update tests for any new behavior.
4. Update `CHANGELOG.md` under the `[Unreleased]` section.
5. Open a PR against `main`. Fill in the PR template.
6. A maintainer will review within a few business days. Address review comments with new commits (do not force-push during review).
7. Once approved, the maintainer squash-merges.

**Human contributions only.** PRs that appear to be fully AI-generated without meaningful review or understanding by the submitter will be closed. We welcome AI-assisted development, but the human submitting the PR is responsible for its correctness.

---

## Coding Standards

- **ES modules only** — no CommonJS `require()`.
- **No TypeScript** in source files — the library targets vanilla ES module consumers. Type definitions (`.d.ts`) are welcome as a separate contribution.
- **Three.js version** — target the version pinned in `package.json`. Do not use APIs removed before that version.
- **No external runtime dependencies** beyond `three` — keep the bundle lean.
- Material instances returned by helpers should be **fresh clones**, not shared singletons, to avoid state leakage between scenes.
- Dispose geometry and materials in `dispose()` methods to avoid GPU memory leaks.

---

## Adding a New Component

Each industrial component lives in `src/components/`. Follow this pattern:

```js
// src/components/Valve.js

export class BallValve {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [opts]
   * @param {[number,number,number]} [opts.position=[0,0,0]]
   * @param {number} [opts.diameter=0.1]  pipe diameter in metres
   */
  constructor(scene, opts = {}) {
    const { position = [0, 0, 0], diameter = 0.1 } = opts
    this._open = false
    this._group = new THREE.Group()
    this._group.position.set(...position)
    this._buildGeometry(diameter)
    scene.add(this._group)
  }

  /** @param {boolean} open */
  setOpen(open) {
    this._open = open
    // rotate ball 90° to open/close
  }

  /** @param {number} dt seconds since last frame */
  update(dt) {
    // animate if needed
  }

  dispose() {
    // traverse and dispose geometries / materials
  }
}
```

Export the new class from `src/index.js`.

Add a usage snippet to `README.md` under the **API** section.

Add at least one unit test in `tests/components/Valve.test.js`.

---

## Writing Examples

Examples live in `examples/<name>/`. Each example must be:

- **Self-contained** — one `index.html` that works with `npm run dev` without extra build steps.
- **Import-map based** — use the same `importmap` pattern as the cooling-system example.
- **Commented** — inline comments explaining what each section does, since examples serve as documentation.

Add a link to the new example in `README.md`.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE) that covers this project.
