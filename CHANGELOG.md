# Changelog

All notable changes to this project will be documented in this file. The project follows Semantic Versioning.

## [Unreleased]

### Added

- Native Git marketplace catalogs for one-time Codex and Claude Code registration followed by short `plugin@agent-toolkit` installs.
- Portable `software-delivery` plugin with a `develop-with-spec` skill for spec-driven implementation, layered verification, and Playwright video evidence.
- Portable `content-authoring` plugin with a `manage-post` skill for create, update, and verify operations, including auto-detected Quidproquo rules.
- Portable `security-engineering` plugin with a `develop-securely` skill for threat modeling, OWASP-based secure coding, and severity-classified security review, including agentic-AI trust-boundary, prompt-injection, and delegated-authorization guidance. Bundles `scan-secrets.mjs`, `scan-dependencies.mjs`, and `fetch-platform-alerts.mjs` so findings are grounded in actual scanner and GitHub-alert output, not code reading alone. Auto-detects casual, non-technical requests and switches to a plain-language report with copy-pasteable AI-tool instructions instead of a technical findings table, so non-engineer vibe coders can act on results too.
- Self-contained Web/Agent-Skills artifacts generated from canonical skills.
- Cross-platform CI and installer smoke tests.
- Contribution, security, conduct, and release guidance.
- GitHub issue and pull request templates.

### Changed

- Co-located Codex and Claude manifests with canonical plugin skills so marketplace installs no longer depend on generated or duplicated packages.
- Calibrated `develop-with-spec` against a production cross-repository delivery process, adding mock-versus-real audits, contract dependency ordering, cross-layer invariants, E2E cleanup proof, review loops, clean-worktree release preparation, and CI blocker classification.
- Reworked the README into a public project landing page with a GitHub-based quick start, workflow examples, an explicit support matrix, CLI reference, and contributor guidance.
- Deep Research now hands article drafts or existing-article refreshes to `manage-post` when that skill is installed.
- Hardened plugin packaging and skill installation against path traversal.
- Declared MIT in repository and portable plugin metadata.

### Removed

- Gemini CLI adapters and packaging support.

## [0.1.0] - 2026-08-22

### Added

- Portable `deep-research` Agent Plugin and canonical Agent Skill.
- Codex and Claude Code adapters.
- Deterministic validation, packaging, and local linking tools.
