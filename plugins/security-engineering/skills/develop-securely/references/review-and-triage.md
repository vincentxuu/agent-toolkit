# Review and Triage

How to run a security-focused review of a diff, PR, or reported vulnerability, and how to write up what you find so it's auditable later.

## 1. Scope the diff before reading line by line

Identify, from the diff or PR:

- new or changed dependencies (check `secure-coding-checklist.md` §"Modern additions");
- new file, network, process, or credential access;
- changed authentication or authorization logic;
- changed input parsing, deserialization, or templating;
- for agentic changes: new prompt content sources, new tool grants, new MCP servers, new delegated credentials (see `agentic-ai-security.md`).

State scope explicitly in the report. A review that silently skips a changed file is worse than one that says "N files out of scope, here's why."

## 2. Classify severity: exploitability × impact

Use a lightweight triage rather than requiring full CVSS scoring (link a CVSS calculation only when the repository's process requires one):

| Severity | Exploitability | Impact |
|---|---|---|
| **Critical** | Reachable without authentication or user interaction | Full compromise, mass data exposure, or remote code execution |
| **High** | Reachable with low-privilege auth, or requires minor user interaction (e.g., following a link) | Significant data exposure, privilege escalation, or single-account compromise |
| **Medium** | Requires specific conditions, elevated privilege, or non-trivial user interaction | Limited data exposure or degraded integrity/availability |
| **Low** | Requires unusual conditions or local access | Minor information disclosure or hardening gap |
| **Informational** | Not independently exploitable | Best-practice deviation worth fixing opportunistically |

Every "Critical" or "High" finding needs a concrete exploit scenario — a stated attacker starting position and the steps to reach impact — not "this could theoretically be misused."

## 3. False-positive discipline

- Don't flag a deviation from a checklist item that has no reachable path in this codebase (e.g., a missing header on an endpoint that isn't served over HTTP at all).
- State your assumption when you're not certain a path is reachable, and mark the finding's confidence accordingly (`confirmed` / `plausible, needs verification` / `hardening suggestion, non-blocking`).
- Don't inflate severity to make a review look thorough — an inflated severity list gets triaged as noise and the next real Critical gets missed in it.

## 4. False-negative discipline

- Don't approve because the code "looks clean" — walk the checklist sections that apply to this diff's blast radius explicitly (see `SKILL.md` §3–4), and note which you checked.
- For any change to auth, crypto, or trust-boundary logic, actively look for the specific classes in `secure-coding-checklist.md` rather than general code quality.
- For agentic changes, explicitly run the lethal-trifecta check and the six-axis capability enumeration from `threat-modeling.md` — a clean-looking diff can still combine three individually-fine capabilities into an exfiltration path.

## 5. Verify, don't just assert

Run the bundled scripts before relying on code reading alone — they turn part of the review into actual tool output instead of model inference:

- `scripts/scan-secrets.mjs <path>` — gitleaks if installed, otherwise a smaller built-in regex set. Either way, findings are grounded in a scan, not a read-through.
- `scripts/scan-dependencies.mjs <path>` — detects the ecosystem from its manifest + lockfile and runs the matching SCA tool (`npm audit`, `pnpm audit`, `yarn audit`, `pip-audit`, `govulncheck`, or `cargo-audit`). Reports `no-scanner-available` explicitly per ecosystem rather than silently skipping it.
- `scripts/fetch-platform-alerts.mjs` — pulls the repository's own open GitHub Code Scanning, Dependabot, and Secret Scanning alerts via `gh`. Free signal if the repository already has these features enabled; report each source's status even when a source is disabled or the token lacks permission, don't just omit it.

Each script exits non-zero when it finds something and prints an explicit note when a backing tool wasn't available — treat a missing tool as "not checked," never as "checked, clean."

Beyond the scripts, exercise the negative case for anything they can't cover:

- injection payload through the actual pipeline (not a paraphrased version);
- sandbox/permission escape attempt against the actual boundary;
- privilege-escalation attempt with a unique sentinel value, checked for whether it appears somewhere it shouldn't.

Mark any finding or clean-pass conclusion that was **not** exercised by a script or a negative test as `unverified — code review only` in the report. This distinction is the difference between "reviewed" and "tested."

## 6. Reporting format

For each finding, record:

```
ID:            <short id, e.g. SEC-01>
Title:         <one line>
Location:      <file:line or endpoint>
Category:      <STRIDE category and/or OWASP checklist item>
Severity:      Critical | High | Medium | Low | Informational
Exploit path:  <concrete attacker starting point → steps → impact>
Evidence:      <what was checked: code read, negative test run, tool output>
Remediation:   <specific fix, not "harden this">
Status:        Blocking | Non-blocking | Accepted risk (owner: <name>) | Fixed
```

Use `assets/security-review.md` as the template for the full report, including a scope statement and a summary line: `Clear`, `Blocking findings present`, or `Blocked pending decision: <what>`.

## 7. Handoff discipline

- Report only findings you can defend with the format above — "I have a bad feeling about this function" is a note for the design discussion, not a finding.
- Do not fix a security-critical finding as a side effect of the review unless the request authorized changes; flag it and let the owner decide, since a rushed fix to auth/crypto/trust-boundary logic carries its own risk.
- Log every accepted-risk decision with an owner and rationale in the report — an unlogged accepted risk becomes an unexplained gap the next time someone reviews the same code.
- Never summarize a review as "looks secure" or "no issues found" without stating what was actually checked; state the checklist sections and threat categories applied, matching `SKILL.md` §6.
