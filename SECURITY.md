# Security Policy

## Supported versions

Security fixes are applied to the latest release and the current `main` branch. Older releases may not receive fixes.

## Reporting a vulnerability

Do not disclose vulnerabilities, credentials, private endpoints, or working exploits in a public issue or pull request.

Use GitHub's private vulnerability reporting flow from the repository's **Security** tab when it is available. If private reporting has not yet been enabled, contact a maintainer through a private contact method listed on the maintainer's GitHub profile and include only enough public information to establish contact.

Include:

- affected plugin, skill, adapter, or script;
- impact and realistic attack scenario;
- reproduction steps or proof of concept;
- affected versions or commit;
- suggested mitigation, if known.

Maintainers should acknowledge a complete report within seven days, coordinate remediation and disclosure with the reporter, and publish an advisory when users need to take action.

## Security boundaries

- Plugin packages must not contain credentials or private deployment URLs.
- Remote MCP credentials belong in the client's secret-backed configuration.
- Generated packages must remain contained within `dist/`.
- Installers must not overwrite an existing skill destination.
- Repository and plugin content should be treated as untrusted until reviewed.
