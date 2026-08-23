# Threat Modeling

Adapted from the [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) and current agentic-AI trust-boundary research. Use this before implementation for a new design, and re-run it when a change materially alters trust boundaries (new data source, new capability, new external actor).

## The four questions

Work through these in order; do not skip to mitigations before the first two are answered.

1. **What are we building?** Draw or describe the data flow: actors, entry points, processes, data stores, and every trust boundary a request crosses (network edge, process boundary, privilege boundary, model-context boundary).
2. **What can go wrong?** Walk each trust boundary against STRIDE (below).
3. **What are we going to do about it?** For each credible threat, pick a concrete mitigation — a control, a design pattern, or an explicit accepted risk with an owner.
4. **Did we do a good job?** Re-check the model against the as-built system, not the as-designed one, before sign-off.

## STRIDE

| Category | Question to ask at each trust boundary | Typical mitigation |
|---|---|---|
| **S**poofing | Can an actor claim an identity it doesn't have? | Strong authN, mutual TLS, signed tokens |
| **T**ampering | Can data or code be modified in transit or at rest without detection? | Integrity checks, signing, parameterized queries, immutable logs |
| **R**epudiation | Can an actor deny performing an action? | Audit logging tied to authenticated identity, non-repudiable timestamps |
| **I**nformation Disclosure | Can data reach an actor not entitled to see it? | AuthZ checks at every read path, encryption, least-privilege data access |
| **D**enial of Service | Can an actor exhaust a resource for others? | Rate limiting, quotas, bounded queues/timeouts |
| **E**levation of Privilege | Can an actor perform an action above its granted level? | Explicit authZ checks (not just authN), capability scoping, PEP/PDP re-check per action |

Record the table with columns `Threat | STRIDE category | Likelihood | Impact | Mitigation | Status` in `assets/threat-model.md`.

## Agentic addendum

Classic STRIDE assumes data and code are architecturally separable. In an LLM-based system they are not: system prompt, user input, retrieved documents, and tool output all flatten into one undifferentiated token stream. Nothing reaching the model is "just data" by construction — treat any external content the model will read as a potential instruction source.

**Canonical case study:** EchoLeak (CVE-2025-32711) — a zero-click Microsoft 365 Copilot data-exfiltration chain that bypassed an XPIA classifier, link redaction, and CSP egress controls in sequence. Each control looked adequate in isolation; the chain wasn't caught because no single control owned the end-to-end trust boundary. Model any agentic design the same way — as a chain, not a set of independent controls.

### Lethal trifecta triage

From Simon Willison's framing: flag a design as high-risk whenever a single agent session combines all three of:

- access to **private or sensitive data**,
- exposure to **untrusted external content** (web pages, retrieved docs, tool output, another agent's messages), and
- the ability to **communicate externally** (a network call, sending email, writing to a shared doc, calling another tool).

If a design has all three, the mitigation is to remove one leg — not to add a fourth control on top. Prompting the model to "not be tricked" does not remove a leg.

### Trust-boundary design patterns

When a design lets an LLM decide both what data to read and what action to take, pick one of these patterns (arXiv:2506.08837) rather than relying on model behavior alone:

- **Action-Selector** — the model picks from a fixed, pre-authorized set of actions; it cannot construct novel ones.
- **Plan-Then-Execute** — the model produces a plan before seeing untrusted content, and the plan (not the model's live reaction) governs execution.
- **LLM Map-Reduce** — untrusted content is processed by isolated sub-calls with no ambient capability, then reduced by a separate step.
- **Dual LLM** — a privileged model that never sees untrusted content orchestrates a quarantined model that does.
- **Code-Then-Execute** — the model emits code/queries that are statically checked before running, instead of directly invoking tools.
- **Context-Minimization** — untrusted content is stripped of anything that could parse as an instruction before it reaches the model.

**CaMeL** (DeepMind, arXiv:2503.18813) is the reference implementation of an architectural (not behavioral) fix: it tags data with capability metadata and enforces a data-flow graph, so a value derived from untrusted content cannot silently drive a privileged action.

Multi-agent designs add a propagation risk: injected instructions can self-replicate across agent-to-agent handoffs (see the Morris II worm and "Prompt Infection" research). Do not let an inter-agent message carry executable instructions without the same trust-boundary pattern applied at the receiving agent.

### Capability-first threat modeling for sandboxes and tool grants

Before choosing a container, permission set, or tool allowlist, enumerate:

1. reachable filesystem paths (read and write),
2. spawnable processes,
3. reachable network destinations,
4. held credentials and tokens (including inherited ambient ones),
5. callable tools and their own transitive capabilities,
6. where output can be sent (files, network, another agent, a human).

Most real-world "agent escapes" are legitimate use of an over-broad grant on one of these six axes, not a novel exploit. Threat model the grant, not just the sandbox boundary around it.

Governance references for citing scope or maturity: OWASP Agentic AI Top 10, MITRE ATLAS, NIST Zero Trust Architecture guidance applied to AI agents.

## Further reading

- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- [quidproquo.cc — Agent 安全的同一條裂縫：從 Prompt Injection、信任邊界到 Multi-Agent 蠕蟲](https://quidproquo.cc/posts/ai/2026-06-04-agent-security-prompt-injection-trust-boundaries/) — the source for the agentic addendum above, with full citations for EchoLeak, the six design patterns, and CaMeL
- [quidproquo.cc — security tag](https://quidproquo.cc/tags/security/) — ongoing CVE-grounded coverage of agent/MCP-server supply-chain incidents, useful for current examples during a review
