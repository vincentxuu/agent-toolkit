# Agent Toolkit

A portable home for reusable Agent Plugins, Agent Skills, MCP declarations, and thin host adapters.

Status: early-stage and usable for local development. Public releases follow Semantic Versioning and the process in [`RELEASING.md`](RELEASING.md).

## Layout

```text
plugins/
  deep-research/
    plugin.json                 # Agent Plugins v1 manifest
    skills/deep-research/       # canonical Agent Skill
  content-authoring/
    plugin.json
    skills/manage-post/         # create, update, verify + Quidproquo rules
adapters/
  codex/deep-research/          # Codex-native compatibility layer
  claude/deep-research/         # Claude Code compatibility layer
scripts/
  link-skill.mjs                # local user/project installer
  package-host.mjs              # assemble a host-native artifact
  validate.mjs                  # repository validation
```

Agent Plugins v1 clients consume `plugin.json` and `skills/` directly. Clients that only implement Agent Skills can install the same canonical skill through their normal discovery directory. Host adapters contain metadata only; they do not fork `SKILL.md`.

## Compatibility model

| Client type | Distribution |
|---|---|
| Agent Plugins v1 client | Use `plugins/<plugin>/` or the generated `dist/standard/<plugin>/` package |
| Codex native plugin flow | Generate `dist/codex/<plugin>/` |
| Claude Code plugin flow | Generate `dist/claude/<plugin>/` |
| Agent Skills-only client | Link or copy the canonical skill into a supported skills discovery directory |
| Web agent with Skill upload | Import or zip the self-contained directory under `dist/web/<plugin>/skills/<skill>/` as that host requires |
| Web agent without Skill support | Use a platform-specific instructions wrapper; do not claim native plugin support |

Client support changes independently of this repository. The portable Agent Plugins package remains the source contract; adapters exist only for clients that still require native metadata.

Host-specific files live outside the portable plugin root. Build an installable compatibility artifact only when a native wrapper is required:

```bash
npm run package -- deep-research codex
npm run package -- deep-research claude
npm run package -- content-authoring codex
npm run package -- content-authoring web
```

Artifacts are written under `dist/<host>/<plugin>/`.

Generated packages include the MIT license, canonical skills, and the relevant host manifest where applicable. Web artifacts contain the self-contained canonical skill without a CLI-specific manifest. `npm test` also writes `dist/SHA256SUMS` for artifact verification. Gemini CLI is intentionally outside the supported adapter matrix.

## Validate

Requires Node.js 20 or newer.

```bash
npm test
```

The full suite validates manifests and skills, assembles every supported host package, checks required artifact files, and smoke-tests link and copy installation paths. CI runs it on Node.js 20, 22, and 24 across Linux, macOS, and Windows.

## Use the CLI

Install a skill into the current project. Copy is the safe default:

```bash
node bin/agent-toolkit.mjs add deep-research
node bin/agent-toolkit.mjs add manage-post
```

Use `--claude` for Claude Code, `--all` for both shared and Claude discovery paths, or `--global` for a user-level install:

```bash
node bin/agent-toolkit.mjs add manage-post --claude
node bin/agent-toolkit.mjs add manage-post --all
node bin/agent-toolkit.mjs add manage-post --global
```

From another working directory, pass an explicit project root:

```bash
node bin/agent-toolkit.mjs add manage-post --project /path/to/project
```

The installer refuses to overwrite a differing destination. Add `--link` only for local contributor development; copied installs are portable and do not depend on this checkout remaining in place. Start a new agent session after installation so the client reloads skills.

Once the package is published, the same interface can be invoked through its package runner. Until then, use the checked-out CLI shown above.

## Included plugins

| Plugin | Skill | Behavior |
|---|---|---|
| `deep-research` | `deep-research` | Evidence-first multi-source research with local and Web tool routing |
| `content-authoring` | `manage-post` | Create, update, or verify Markdown articles; auto-loads Quidproquo rules only for that target |

`manage-post` is one lifecycle skill with explicit create, update, and verify routing. Shared evidence, safety, and authority rules remain canonical; site-specific paths, schema, language behavior, glossary, and validation load only for Quidproquo.

Typical invocations:

```text
Use $manage-post to create an article from these notes.
Use $manage-post to update the article at <path> with current API behavior.
Use $manage-post to verify this article without changing it.
```

Coding-agent and Web-agent support are separate dimensions. Codex and Claude Code receive native wrappers; Agent Plugins/Agent Skills clients consume the standard source; Web agents receive the same self-contained skill and use its no-filesystem output branch. A Web product is supported only when it can actually import that skill or plugin format.

## Groundlane connection

The `deep-research` skill supports either a local or remote Groundlane MCP connection, but this repository intentionally does not ship a portable `mcp.json` yet. Agent Plugins v1 does not define portable secret references for authenticated HTTP headers, and credentials must never be embedded in a plugin.

Configure the Groundlane endpoint and bearer credential in each client's secret-backed MCP settings. A Web-hosted agent requires a publicly reachable HTTPS endpoint; it cannot connect to a user's localhost. If Groundlane later supports MCP OAuth, the plugin can add a portable `mcp.json` without shipping secrets.

## Adding another plugin

Create `plugins/<plugin-name>/plugin.json`, place canonical skills under `plugins/<plugin-name>/skills/`, and add host adapters only where the host does not yet consume Agent Plugins v1 directly. Keep scripts, references, and assets beside their owning skill.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Report sensitive issues according to [`SECURITY.md`](SECURITY.md), and follow the [`Code of Conduct`](CODE_OF_CONDUCT.md) in project spaces.

All plugins currently use lockstep repository versioning. Use `npm run set-version -- <semver>` rather than editing manifest versions independently.

## License

MIT. See [`LICENSE`](LICENSE).
