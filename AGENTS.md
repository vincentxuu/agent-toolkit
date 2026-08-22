# Repository instructions

- Treat `plugins/<plugin>/skills/` as the only canonical source for skill content.
- Keep each skill compliant with the Agent Skills specification: one directory, one `SKILL.md`, and only relative references to bundled resources.
- Keep root `plugin.json` compliant with Agent Plugins v1. Host-specific manifests are thin adapters and must not duplicate skill prose.
- Never commit tokens, provider keys, expanded authorization headers, private deployment URLs, or personal absolute paths.
- Do not add authenticated remote MCP configuration to portable `mcp.json` until its authentication can be represented without embedding credentials.
- Run `npm test` after changing a manifest, skill, reference, or installer.
