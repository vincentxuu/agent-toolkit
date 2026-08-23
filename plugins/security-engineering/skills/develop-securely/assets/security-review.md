# Security Review: <diff / PR / vulnerability report>

Reviewer: <name or agent>
Date: <date>
Scope: <files, endpoints, or flows reviewed — and what was explicitly out of scope, with why>

## Checklist sections and threat categories applied

- Secure coding checklist sections: <list, e.g. "Input Validation, Access Control, Database Security">
- Threat categories checked: <STRIDE categories and/or agentic checks run, e.g. "Elevation of Privilege, lethal-trifecta check">
- Sections explicitly not applicable to this diff: <list — with why>

## Findings

| ID | Title | Location | Category | Severity | Exploit path | Evidence | Remediation | Status |
|---|---|---|---|---|---|---|---|---|
| SEC-01 | | | | Critical/High/Medium/Low/Informational | | code review only / negative test run | | Blocking / Non-blocking / Accepted risk / Fixed |

## Verification performed

### Tool-backed scans

| Script | Tool used | Result |
|---|---|---|
| `scan-secrets.mjs` | gitleaks / builtin-fallback | <finding count, or "not run"> |
| `scan-dependencies.mjs` | <detected ecosystem tool(s)> | <finding count, or "no manifest detected" / "not run"> |
| `fetch-platform-alerts.mjs` | GitHub Code Scanning / Dependabot / Secret Scanning | <open count per source, or "not run"> |

### Negative tests

<List every negative test actually run — injection payload attempted, sandbox escape attempted, privilege-escalation attempt with sentinel value, etc. — with outcome. If none were run, state that explicitly; every finding above is then "code review only.">

If a script above was not run, state why (tool unavailable, out of scope, no network/`gh` access) — do not silently omit it.

## Accepted risks

| Risk | Owner | Rationale | Revisit by |
|---|---|---|---|
| | | | |

## Summary

Status: **Clear** / **Blocking findings present** / **Blocked pending decision: <what>**

<One or two sentences. State what was checked, not "looks secure." Do not imply anything beyond this review's scope — e.g., do not claim infrastructure or dependencies outside scope were verified.>
