# Changelog

All notable changes to this project will be documented in this file. The project follows Semantic Versioning.

## [Unreleased]

### Added

- Portable `content-authoring` plugin with a `manage-post` skill for create, update, and verify operations, including auto-detected Quidproquo rules.
- Self-contained Web/Agent-Skills artifacts generated from canonical skills.
- Cross-platform CI and installer smoke tests.
- Contribution, security, conduct, and release guidance.
- GitHub issue and pull request templates.

### Changed

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
