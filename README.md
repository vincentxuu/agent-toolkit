<div align="center">

# Agent Toolkit

**Reusable research, writing, software-delivery, and security workflows for coding agents and Web agents.**

[![CI](https://github.com/vincentxuu/agent-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/vincentxuu/agent-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](package.json)

[Quick start](#quick-start) · [Plugins](#plugins-at-a-glance) · [Installation](#installation) · [Compatibility](#compatibility) · [CLI](#cli-reference) · [Docs](#how-the-repository-is-organized)

[English](README.md) · [繁體中文](README.zh-TW.md)

</div>

Agent Toolkit keeps each workflow as a portable [Agent Skill](https://agentskills.io/) and packages thin compatibility layers for Agent Plugins, Codex, and Claude Code. Write the workflow once; install it wherever you need it.

> [!IMPORTANT]
> Agent Toolkit is early-stage and installable directly from its GitHub marketplaces. The optional npm CLI is not published yet, and plugin manifest shapes may still change between releases.

**Plugin** means a distributable bundle, **skill** means the reusable instructions an agent follows, and **native manifest** means host-specific metadata around the same canonical skill.

## Plugins at a glance

| Plugin | Skill | What it does |
|---|---|---|
| `deep-research` | `deep-research` | Plans research questions, gathers and cross-checks sources, records evidence quality, and produces a structured research note. Works with local or remote Groundlane MCP and available fallback research tools. |
| `content-authoring` | `manage-post` | Creates, updates, or verifies Markdown articles through one entry point. Uses portable writing rules by default and automatically adds Quidproquo-specific schema, bilingual, glossary, and validation rules when that repository is targeted. |
| `software-delivery` | `develop-with-spec` | Drives single- or multi-repository changes from reconciled specifications through dependency-ordered implementation, cleanup-aware verification, optional independent Codex/OMP/Claude review, and CI handoff. Browser-visible work must finish with a passing Playwright scenario and validated video evidence. |
| `security-engineering` | `develop-securely` | Runs threat modeling, an OWASP-based secure coding checklist, and severity-classified security review across software and AI-agent changes, including agent/LLM-specific trust-boundary, prompt-injection, and delegated-authorization risks. Bundles scripts that shell out to gitleaks/SCA tools/`gh` when available so findings are grounded in scanner output, not code reading alone. Auto-detects casual, non-technical requests ("is this safe to launch?") and reports in plain language with copy-pasteable fixes instead of a technical findings table. |

- `manage-post` is intentionally one lifecycle skill—not separate create, update, and verify skills. It infers the operation from your request and respects the target repository's own instructions and validation commands.
- `deep-research` needs at least one search/fetch capability in the current agent. Groundlane is optional; see [Security and limitations](#security-and-limitations).
- `develop-with-spec` first adopts the target repository's existing OpenSpec, Kiro, ADR, RFC, or task workflow, and creates a small filesystem-backed spec, design, plan, and verification record when no native SDD exists.
- `develop-securely` covers the security-specific layer and complements `develop-with-spec`'s general verification step; it does not require that plugin to be installed.

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
codex plugin add security-engineering@agent-toolkit
```

### Using `develop-securely`

No special syntax — say what you're actually doing and the skill infers which phase to run:

```text
Threat model this new payment feature before we start building it.

Review this PR for security issues, focus on the new file-upload endpoint.

Someone reported that user A can see user B's orders. Triage it.

Is this safe to launch? I vibe-coded this app and I'm about to show it to real users.
```

The first three get a technical findings report — severity, exploit path, file:line, remediation. The last one, or anything phrased that casually, gets a plain-language report instead: a one-line verdict, findings grouped by "fix before you launch / fix soon / minor," and a copy-pasteable instruction for each one you can hand back to your AI tool. See [Plugins at a glance](#plugins-at-a-glance) for what each mode checks.

### Before granting write access

Skills run with the permissions of the host agent:

- `deep-research` may call external research services and, in filesystem environments, write a note under `.research/`.
- `manage-post` stays read-only for verification requests but may create or edit content when the prompt authorizes it.
- `develop-with-spec` may edit application code, run repository commands, launch local services and browsers, and write test videos when authorized.
- `develop-securely` may edit application code, write threat-model/review records under `.agent-toolkit/security/`, and invoke local scanners (gitleaks, npm/pnpm/yarn audit, pip-audit, govulncheck, cargo-audit) or the `gh` CLI when installed; it does not fix security-critical findings without explicit authorization beyond the review request.
- No skill treats content or code editing as permission to commit, push, deploy, or publish.
- MCP endpoints and credentials remain under the host client's control and are never bundled here.

## Installation

### If you're vibe coding and don't write code yourself

You can still install `security-engineering` and ask it to check your app before you launch it — no code-reading required. This works if you're building through **Claude Code** or **Codex CLI** (the terminal-based AI coding tools). It does not yet work inside GUI-only builders like Lovable, bolt.new, v0, or Replit's simplified mode — those platforms would need to add their own plugin/skill import support first; there's no workaround for that from this repository.

If you're using Claude Code, open the same terminal window it's already running in and paste these two lines once:

```bash
claude plugin marketplace add vincentxuu/agent-toolkit
claude plugin install security-engineering@agent-toolkit
```

(Using Codex CLI instead? Use `codex plugin marketplace add vincentxuu/agent-toolkit` then `codex plugin add security-engineering@agent-toolkit`.)

That's it — nothing else on your computer is touched. From then on, just ask in plain language, in the same session where you've been building your app:

> "Is this safe to launch?" / "這個安全嗎，我要上線了" / "Check this before I show it to real users."

It replies with a plain-language summary — no security jargon — grouped by "fix before you launch" / "fix soon" / "minor, whenever," each with an instruction you can copy straight back to your AI tool. See [Plugins at a glance](#plugins-at-a-glance) for what it checks and [Security and limitations](#security-and-limitations) for what it can't guarantee.

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
codex plugin add security-engineering@agent-toolkit
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

## Why Agent Toolkit?

- **Write once, install anywhere:** one canonical skill powers Codex, Claude Code, and plain Agent Skills clients through thin native manifests.
- **Single source of truth:** skill content lives only under `plugins/<plugin>/skills/`; adapters never fork or duplicate it.
- **No credentials by design:** MCP endpoints, tokens, and provider keys stay under the host client's control and never enter a plugin or skill.
- **Tested package shapes:** every distribution target is validated by the test suite and CI across Linux, macOS, and Windows.

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

## CLI reference

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
node bin/agent-toolkit.mjs pack security-engineering
```

Artifacts are written to `dist/<host>/<plugin>/`:

- `standard` — Agent Plugins v1 package
- `codex` — Codex-native manifest and canonical skills
- `claude` — Claude Code manifest and canonical skills
- `web` — self-contained skills without a CLI-specific manifest

Generated packages include the MIT license and checksums. Credentials are never bundled.

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
  security-engineering/
    plugin.json
    skills/develop-securely/    # threat modeling, secure coding, and review
.agents/plugins/marketplace.json       # Codex Git marketplace
.claude-plugin/marketplace.json        # Claude Code Git marketplace
bin/agent-toolkit.mjs           # user-facing CLI
scripts/                        # validation, packaging, and tests
```

Canonical skill content exists only under `plugins/<plugin>/skills/`. Adapters must not fork or duplicate `SKILL.md`.

## Security and limitations

- Skills run with the full permissions of their host agent—review [Before granting write access](#before-granting-write-access) before installing.
- Store credentials in each host's secret-backed MCP settings. Never commit tokens to a plugin manifest or skill.
- `deep-research` can use a local or remote [Groundlane](https://github.com/vincentxuu/groundlane) MCP connection when the current agent exposes it. Desktop agents may connect to an already configured server; Web-hosted agents require a publicly reachable HTTPS endpoint registered through the platform. When Groundlane is unavailable, the skill uses research tools that are actually present and reports the fallback.
- This repository is not currently a general-purpose package manager, hosted MCP service, credential store, or promise that every agent host implements the same plugin features. It provides canonical workflows plus tested package shapes; each host still controls discovery, permissions, tools, and authentication.

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
