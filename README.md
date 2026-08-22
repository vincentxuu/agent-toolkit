# Agent Toolkit

[![CI](https://github.com/vincentxuu/agent-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/vincentxuu/agent-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](package.json)

Reusable research, writing, and software-delivery workflows for coding agents and Web agents.

Agent Toolkit keeps each workflow as a portable [Agent Skill](https://agentskills.io/) and packages thin compatibility layers for Agent Plugins, Codex, and Claude Code. Write the workflow once; install it wherever you need it.

> **Project status:** early-stage and installable directly from its GitHub marketplaces. The optional npm CLI is not published yet.

**Plugin** means a distributable bundle, **skill** means the reusable instructions an agent follows, and **native manifest** means host-specific metadata around the same canonical skill.

- [Quick start](#quick-start)
- [Available workflows](#available-workflows)
- [Installation](#installation)
- [Compatibility](#compatibility)
- [CLI reference](#cli-reference)
- [Development](#development)

## Quick start

Add the marketplace once, then install the plugin you want:

```bash
codex plugin marketplace add vincentxuu/agent-toolkit
codex plugin add software-delivery@agent-toolkit
```

Start a new Codex session, then use the bundled skill:

```text
$develop-with-spec

Add this account setting from spec through implementation, then record the passing browser flow with Playwright.
```

The marketplace command is one-time. Install the other plugins with one command each:

```bash
codex plugin add deep-research@agent-toolkit
codex plugin add content-authoring@agent-toolkit
```

### Before granting write access

Skills run with the permissions of the host agent:

- `deep-research` may call external research services and, in filesystem environments, write a note under `.research/`.
- `manage-post` stays read-only for verification requests but may create or edit content when the prompt authorizes it.
- `develop-with-spec` may edit application code, run repository commands, launch local services and browsers, and write test videos when authorized.
- No skill treats content or code editing as permission to commit, push, deploy, or publish.
- MCP endpoints and credentials remain under the host client's control and are never bundled here.

## Available workflows

| Plugin | Skill | What it does |
|---|---|---|
| `deep-research` | `deep-research` | Plans research questions, gathers and cross-checks sources, records evidence quality, and produces a structured research note. Works with local or remote Groundlane MCP and available fallback research tools. |
| `content-authoring` | `manage-post` | Creates, updates, or verifies Markdown articles through one entry point. Uses portable writing rules by default and automatically adds Quidproquo-specific schema, bilingual, glossary, and validation rules when that repository is targeted. |
| `software-delivery` | `develop-with-spec` | Drives single- or multi-repository changes from reconciled specifications through dependency-ordered implementation, cleanup-aware verification, review, and CI handoff. Browser-visible work must finish with a passing Playwright scenario and validated video evidence. |

`manage-post` is intentionally one lifecycle skill—not separate create, update, and verify skills. It infers the operation from your request and respects the target repository's own instructions and validation commands.

Examples:

```text
Use manage-post to create an article from these incident notes.
Use manage-post to update docs/posts/retry-design.md with the current API behavior.
Use manage-post to verify this article and report problems without editing it.
```

`deep-research` needs at least one search/fetch capability in the current agent. Groundlane is optional. When no network research tool exists, the skill works from supplied materials or reports the blocker rather than pretending it verified external claims. Its detailed workflow is currently authored primarily in Traditional Chinese.

`develop-with-spec` first adopts the target repository's existing OpenSpec, Kiro, ADR, RFC, or task workflow. It audits whether visible UI is backed by real storage/API/runtime behavior, follows generated-contract and cross-repository dependency order, verifies disposable-state cleanup, and separates feature regressions from dependency or external CI blockers. When no native SDD exists, it creates a small filesystem-backed spec, design, plan, and verification record.

```text
Use develop-with-spec to add this account setting from spec through implementation, then record the passing browser flow with Playwright.
```

## Installation

### Codex

Register this GitHub repository once:

```bash
codex plugin marketplace add vincentxuu/agent-toolkit
```

Install any plugin:

```bash
codex plugin add software-delivery@agent-toolkit
codex plugin add deep-research@agent-toolkit
codex plugin add content-authoring@agent-toolkit
```

### Claude Code

Register the same repository once, then install a plugin:

```bash
claude plugin marketplace add vincentxuu/agent-toolkit
claude plugin install software-delivery@agent-toolkit
```

Use `--scope project` on the install command when the project should declare the Claude plugin for collaborators.

### Agent Skills-only clients

Clients without native marketplace support can copy a canonical skill into the current project's `.agents/skills` directory. This fallback requires Node.js 20 or newer:

```bash
npx --yes github:vincentxuu/agent-toolkit add develop-with-spec
```

Use `--claude`, `--all`, or `--global` only for direct skill-copy workflows. Native Codex and Claude installations should use their marketplace commands above.

### Contributor checkout

Clone the repository when you want to modify skills or build plugin artifacts:

```bash
git clone https://github.com/vincentxuu/agent-toolkit.git
cd agent-toolkit
npm test
node bin/agent-toolkit.mjs list
```

Use `--link` only while developing locally. Normal installs copy the skill so they do not break when this checkout moves.

## Compatibility

The shared skill is the portability layer. Plugin manifests and discovery paths are host-specific.

| Target | Support | Distribution |
|---|---:|---|
| Agent Plugins v1 clients | ✅ | `plugins/<plugin>/` or `dist/standard/<plugin>/` |
| Codex | ✅ | Git marketplace + co-located `.codex-plugin` manifest |
| Claude Code | ✅ | Git marketplace + co-located `.claude-plugin` manifest |
| Other Agent Skills clients | ◐ | Canonical skill, when the client supports a compatible discovery/import path |
| Web agents with skill upload | ◐ | Self-contained `dist/web/.../skills/<skill>/` artifact |
| Web agents without skill/plugin import | — | Use that platform's native instructions and tools |
| Gemini CLI adapter | — | Intentionally not maintained |

`✅` means this repository provides a tested installation or package path. `◐` depends on capabilities exposed by the host. A Web agent cannot access a local checkout or `localhost` unless its platform explicitly provides that connection.

## Fallback CLI reference

```text
agent-toolkit add <skill>              Install into .agents/skills in the current project
agent-toolkit add <skill> --claude     Install into .claude/skills
agent-toolkit add <skill> --all        Install into both discovery directories
agent-toolkit add <skill> --global     Install for the current user
agent-toolkit add <skill> --link       Link instead of copy for local development
agent-toolkit list                     List available plugins and skills
agent-toolkit doctor                   Run the full validation suite
agent-toolkit pack <plugin>            Build every supported package variant
```

Run `npx --yes github:vincentxuu/agent-toolkit help` for the current built-in help. Advanced callers may use `--project <directory>` or `--agent shared|claude|all`.

### Updating or removing

Native plugin installations use their host's lifecycle commands:

```bash
# Codex
codex plugin marketplace upgrade agent-toolkit
codex plugin add software-delivery@agent-toolkit
codex plugin remove software-delivery@agent-toolkit

# Claude Code
claude plugin marketplace update agent-toolkit
claude plugin update software-delivery@agent-toolkit
claude plugin uninstall software-delivery@agent-toolkit
```

Copied skill installs are snapshots. Re-running `add` is a no-op when files are identical and refuses to overwrite differing content. The fallback CLI does not yet provide `update` or `remove`.

### Troubleshooting

| Problem | What to check |
|---|---|
| Plugin is not found | Confirm `agent-toolkit` appears in the host's marketplace list, refresh it, then use `plugin@agent-toolkit`. |
| The agent cannot find the skill | Confirm the skill exists under the client's discovery directory, then start a new agent session. |
| `Destination differs; refusing to overwrite` | The installed copy differs from the toolkit. Review it before manually replacing or removing it. |
| Research cannot access the Web | Confirm the current agent exposes a search/fetch tool or a configured Groundlane MCP connection. |
| A Web agent cannot import the artifact | The host must support skill or plugin upload; a local installation cannot make files visible to a hosted agent. |
| You are unsure where files went | Project installs use the current working directory; user installs use the current user's home directory. Run without `--global` for repository-local behavior. |

## Build plugin packages

Native marketplace users do not need to build artifacts. Maintainers and other distributors can generate host-specific archives from a contributor checkout:

```bash
node bin/agent-toolkit.mjs pack deep-research
node bin/agent-toolkit.mjs pack content-authoring
node bin/agent-toolkit.mjs pack software-delivery
```

Artifacts are written to `dist/<host>/<plugin>/`:

- `standard` — Agent Plugins v1 package
- `codex` — Codex-native manifest and canonical skills
- `claude` — Claude Code manifest and canonical skills
- `web` — self-contained skills without a CLI-specific manifest

Generated packages include the MIT license and checksums. Credentials are never bundled.

## Groundlane and secrets

`deep-research` can use a local or remote [Groundlane](https://github.com/vincentxuu/groundlane) MCP connection when the current agent exposes it. This repository does not embed an authenticated MCP endpoint or bearer token.

- Desktop agents may connect to an already configured local or remote Groundlane server.
- Web-hosted agents require a publicly reachable HTTPS MCP endpoint registered through the platform.
- When Groundlane is unavailable, the skill uses research tools that are actually present and reports the fallback.

Store credentials in each host's secret-backed MCP settings. Never commit tokens to a plugin manifest or skill.

## How the repository is organized

```text
plugins/
  deep-research/
    plugin.json                 # portable Agent Plugins manifest
    .codex-plugin/plugin.json   # Codex-native metadata
    .claude-plugin/plugin.json  # Claude Code-native metadata
    skills/deep-research/       # canonical skill and references
  content-authoring/
    plugin.json
    skills/manage-post/         # canonical article lifecycle skill
  software-delivery/
    plugin.json
    skills/develop-with-spec/   # spec, implementation, and video evidence
.agents/plugins/marketplace.json       # Codex Git marketplace
.claude-plugin/marketplace.json        # Claude Code Git marketplace
bin/agent-toolkit.mjs           # user-facing CLI
scripts/                        # validation, packaging, and tests
```

Canonical skill content exists only under `plugins/<plugin>/skills/`. Adapters must not fork or duplicate `SKILL.md`.

### Non-goals

Agent Toolkit is not currently a general-purpose package manager, hosted MCP service, credential store, or promise that every agent host implements the same plugin features. It provides canonical workflows plus tested package shapes; each host still controls discovery, permissions, tools, and authentication.

## Development

Requires Node.js 20 or newer and has no runtime dependencies.

```bash
npm test
```

The test suite validates plugin and skill metadata, checks version consistency, packages all supported targets, verifies artifact contents and checksums, and exercises copy/link installation paths. CI runs on Node.js 20, 22, and 24 across Linux, macOS, and Windows.

Before adding a plugin or changing release metadata, read [CONTRIBUTING.md](CONTRIBUTING.md) and [RELEASING.md](RELEASING.md). All plugins currently use lockstep repository versioning through:

```bash
npm run set-version -- <semver>
```

## Community and security

- Bugs and feature requests: [GitHub Issues](https://github.com/vincentxuu/agent-toolkit/issues)
- Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security policy: [SECURITY.md](SECURITY.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Changes: [CHANGELOG.md](CHANGELOG.md)

## License

[MIT](LICENSE)
