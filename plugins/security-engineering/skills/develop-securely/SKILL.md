---
name: develop-securely
description: Run threat modeling, an OWASP-based secure coding checklist, and severity-classified security review across a software or AI-agent change. Use when asked to threat model a design, secure code against vulnerabilities, review a diff or PR for security issues, harden an AI agent/LLM/MCP/tool-use surface, triage a vulnerability report, or when a non-technical vibe-coder asks something like "is my app safe," "can I launch this," "check this before I publish it," or "這個安全嗎" / "我要上線了幫我看一下" before showing an AI-built app to real users. Produces a scoped threat model, applies the relevant checklist, and delivers findings with exploit reasoning and remediation status — not a rubber-stamp pass — rendered in the language and depth the requester can act on.
---

# Develop Securely

Run one bounded security pass — threat model, secure coding, or review — against the live system. Treat every external actor, dependency, and piece of retrieved content as untrusted until a specific control proves otherwise.

## 1. Resolve scope, phase, and audience

1. Identify what triggered the request: a new design/feature (→ threat model), code being written or already written (→ secure coding checklist), a diff/PR/branch (→ review), or a reported vulnerability (→ triage under §5's reporting format, root-caused before any fix).
2. Read the target repository's `AGENTS.md` and any existing security documentation, threat models, or `SECURITY.md` before proposing new artifacts. Reuse an existing security process; do not create a parallel one.
3. Determine whether the change touches an AI/LLM surface: prompts, retrieved or tool-returned content reaching a model, agent-to-agent messages, MCP servers, installed skills/plugins, or delegated user credentials. If so, §4 is mandatory, not optional — most exploitable findings in agentic systems live in this surface.
4. State scope explicitly before starting: which files, endpoints, or flows are in scope, and what is explicitly out of scope (e.g., infra not touched by this change). An unscoped review produces unverifiable findings.
5. **Determine the reporting mode.** Read `references/plain-language-reporting.md` for the full decision guide; short version: if the request references a diff, PR, branch, spec, or uses review/security terminology, use **technical mode** (severity tables, exploit scenarios, `assets/security-review.md`). If the request is casual, doesn't name a specific diff/PR, or the person says they're vibe-coding / don't code themselves / just want to know if it's safe to launch, use **plain-language mode** (`assets/plain-language-report.md`) — the underlying checks in §2–§5 do not change, only how results are explained. Default to plain-language mode when the signal is ambiguous; a slightly-too-simple report costs an engineer a follow-up question, while a jargon-heavy report can leave a non-engineer unable to act on it at all. You can always offer the technical report too — the modes aren't mutually exclusive.

## 2. Threat model

Read `references/threat-modeling.md` completely, then work through its four-question framework (what are we building → what can go wrong → what will we do about it → did we do a good job) and the STRIDE table for the change's trust boundaries.

When the design lets an LLM decide what data to read or what action to take, run the **lethal trifecta** check (private-data access + untrusted-content exposure + external communication in one session) and pick one of the six trust-boundary design patterns in `references/threat-modeling.md` rather than relying on prompting the model to behave.

For sandbox, tool-grant, or permission-boundary design, threat-model by capability first: enumerate reachable filesystem paths, spawnable processes, reachable network destinations, held credentials, callable tools, and where output can be sent — before picking a container or permission set. Most real escapes are legitimate use of an over-broad grant, not a kernel exploit.

Record the result in `assets/threat-model.md` (copy the template) under `.agent-toolkit/security/<feature-slug>/threat-model.md`, or the repository's existing threat-model location if one exists. List open risks and the decision owner for each; do not silently accept a risk on the user's behalf.

## 3. Apply the secure coding checklist

Read `references/secure-coding-checklist.md` and apply the sections relevant to the change's blast radius — do not run all thirteen sections against a change that only touches one of them. At minimum, always check input validation, authN/authZ, and secrets handling for any change that parses external input or touches access control.

Prefer fixing a class of issue at its source (validation layer, ORM/parameterization, framework default) over patching each call site. Cite the specific checklist item in commit messages or review notes so the reasoning is auditable later, not just "hardened."

## 4. Cover the AI/agent-specific surface

When step 1 flagged an AI/LLM surface, read `references/agentic-ai-security.md` completely before continuing. It covers prompt-injection framing, the OWASP LLM/Agentic Top 10 categories most relevant to a coding agent (excessive agency, supply chain, hidden context exposure, improper output handling), delegated-authorization anti-patterns, and MCP/tool/skill supply-chain risk.

Never place a user's session cookie, API key, or refresh token directly into a prompt or tool call. Treat installed MCP servers, skills, and plugins as code you are trusting with your capabilities, including this one — review their declared tool grants before increasing them.

## 5. Review and triage

For a diff, PR, or reported vulnerability, read `references/review-and-triage.md` completely and follow its severity-classification (exploitability × impact) and reporting format. Every finding needs a concrete exploit scenario, not a theoretical one — "an attacker could" requires a reachable path, not just a missing best practice.

Run the bundled scripts under `<skill-root>/scripts/` before relying on code reading alone — they ground findings in actual tool output instead of model inference, and degrade explicitly (not silently) when a backing tool isn't installed:

```bash
node <skill-root>/scripts/scan-secrets.mjs <path> [--json]              # gitleaks if present, else a smaller built-in pattern set
node <skill-root>/scripts/scan-dependencies.mjs <path> [--json]         # npm/pnpm/yarn audit, pip-audit, govulncheck, or cargo-audit — whichever ecosystem is detected
node <skill-root>/scripts/fetch-platform-alerts.mjs [--repo o/r] [--json]  # pulls open GitHub Code Scanning, Dependabot, and Secret Scanning alerts via `gh`
```

Where feasible, also verify a finding by attempting the negative case (an injection payload, a sandbox escape attempt, a privilege-escalation attempt with a sentinel value) rather than asserting safety from code reading alone. Mark any conclusion that was not exercised by a script or a negative test as unverified.

Record every finding internally using the severity/exploit-path/evidence fields from `references/review-and-triage.md`, regardless of reporting mode — the translation in plain-language mode changes the words, not the underlying rigor. In technical mode, write `assets/security-review.md` (copy the template). In plain-language mode, write `assets/plain-language-report.md` (copy the template) following the translation rules in `references/plain-language-reporting.md`: no STRIDE/OWASP/CVSS jargon, each finding explained as what it is, what could actually happen to a real user, and a copy-pasteable instruction the person can hand back to their AI tool. A missing scanner (gitleaks, `gh`, an SCA tool) gets translated into a plain, non-alarming note with an optional upgrade path, never surfaced as a raw tool error.

## 6. Reconcile and hand off

Before declaring the pass complete, regardless of mode:

- state which checklist sections and threat categories were actually applied, and which were explicitly out of scope;
- list every finding with its status (blocking / non-blocking / accepted-risk / fixed) — do not report only the fixed ones;
- distinguish findings verified by a negative test from findings based on code reading alone;
- do not fix a security-critical finding without authorization beyond the review request itself — a fix can introduce a new bug, and remediation of auth, crypto, or trust-boundary logic should get the same review rigor as the original change;
- never report a change as "secure"; report it as "reviewed against \<checklist/threat model\>, with \<N\> findings, \<M\> unresolved" — in plain-language mode this becomes a plain verdict line ("safe to launch" / "fix these first" / "stop, this needs a person who codes") plus the same honest caveat that no check proves 100% safety.

In plain-language mode, close by offering the technical report too (build `assets/security-review.md` alongside, or on request) — the person may want to hand it to a developer or paste it into another AI tool, and it should be complete on its own without requiring them to have read the plain-language version first.

This skill covers the security-specific layer. For the surrounding implementation, verification, and evidence workflow, use `develop-with-spec` when installed — this skill's review corresponds to its "verify in layers" step when the review priority is security rather than general correctness or browser evidence.

## Reference index

- Threat modeling (STRIDE, lethal trifecta, capability-first sandbox modeling, trust-boundary design patterns): `references/threat-modeling.md`
- Secure coding checklist (OWASP Secure Coding Practices, adapted): `references/secure-coding-checklist.md`
- AI/agent-specific security (prompt injection, OWASP LLM/Agentic Top 10, delegated auth, MCP supply chain): `references/agentic-ai-security.md`
- Review scoping, severity classification, and reporting format: `references/review-and-triage.md`
- Plain-language reporting mode: how to detect it and translate findings: `references/plain-language-reporting.md`
- Threat model template: `assets/threat-model.md`
- Security review/findings template (technical mode): `assets/security-review.md`
- Plain-language report template (non-technical mode): `assets/plain-language-report.md`
- Tool-backed evidence scripts: `scripts/scan-secrets.mjs`, `scripts/scan-dependencies.mjs`, `scripts/fetch-platform-alerts.mjs`
