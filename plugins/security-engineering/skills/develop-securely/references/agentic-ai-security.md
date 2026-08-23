# AI / Agent-Specific Security

Read this completely whenever a change touches a prompt, retrieved or tool-returned content reaching a model, agent-to-agent messaging, an MCP server, an installed skill/plugin, or a delegated user credential. This is where most exploitable findings in agentic systems live — the classic checklist in `secure-coding-checklist.md` under-covers this surface by design (it predates it).

## Framing: the control/data-plane collapse

In a traditional application, "code" and "data" are separable — a SQL query and a user's search string live in different planes, and injection is what happens when that separation breaks. In an LLM-based system there is no separation to break: the system prompt, user input, retrieved documents, and tool output all flatten into one token stream the model reasons over. Nothing reaching the model is architecturally "just data." Treat any external content the model will read as a potential instruction source, not a passive value.

This reframes what "input validation" means for an agent: you cannot sanitize away the possibility of an instruction appearing in fetched content the way you can escape a SQL string. The mitigation has to be structural (see the trust-boundary patterns in `threat-modeling.md`), not lexical.

## OWASP LLM / Agentic Top 10

Full list: [GenAI Security Project — GenAI/LLM Top 10](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10) (successor to OWASP's Top 10 for LLM Applications). The categories most relevant to a coding agent building or reviewing agentic systems:

| Category | What to check for |
|---|---|
| Prompt Injection | Any untrusted content (web pages, files, tool output, another agent's message) reaching the model without a trust-boundary pattern applied |
| Excessive Agency | Tool/permission grants broader than the task needs; no per-action re-authorization |
| Supply Chain | Installed MCP servers, skills, plugins, and model weights from unverified sources |
| Sensitive Information Disclosure | Secrets, PII, or internal system details reachable through model output or logs |
| Hidden Context Exposure | System prompts, tool schemas, or prior conversation leaking to a party that shouldn't see them |
| Improper Output Handling | Model output executed, rendered, or piped downstream without the same validation as any other untrusted input |
| Unbounded Consumption | No cap on tool calls, tokens, or spawned sub-agents — a runaway loop is a denial-of-service, not just a cost problem |

The remaining categories (Data/Model Poisoning, Misinformation, Vector/Embedding Weaknesses) matter most for teams training or fine-tuning models, or running RAG at scale; note them in a threat model but they're rarely the finding in a coding-agent review.

## Delegated authorization: never hand the model a raw user credential

The most common anti-pattern: putting a user's session cookie, API key, or refresh token directly into a prompt or tool-call payload so an agent can act "as the user." This collapses the trust boundary between the agent and the user's full account — anything that reaches the model (including via injection) can now exfiltrate or misuse that credential.

Prefer a delegated-authorization architecture:

- **OAuth Token Exchange (RFC 8693)** — issue the agent a narrowly-scoped token derived from the user's session, not the session token itself.
- **Resource Indicators (RFC 8707)** — bind the issued token to the specific resource it's allowed to call.
- **Rich Authorization Requests / RAR (RFC 9396)** — express fine-grained scope beyond flat OAuth scopes when the action needs it.
- **DPoP (RFC 9449)** — bind the token to the agent's key so a leaked token alone isn't sufficient to replay it.
- **PEP/PDP re-evaluation (AuthZEN)** — re-check authorization at every execution point the token is used, not only at issuance. A token valid at issuance can still need to be denied for a specific action if context has changed.

## MCP / tool / skill supply chain

Treat every installed MCP server, skill, and plugin as code you are trusting with your capabilities — including this one. Before installing or increasing a grant:

- review the declared tool/capability list; if it's broader than the stated purpose, ask why;
- treat a tool's or skill's *description* as untrusted content too — it enters the model's context alongside everything else and can carry an injection just like a fetched web page;
- prefer scoped, short-lived credentials over static ones for anything a tool call can reach;
- watch for typosquatting on package/server names, and pin to a known-good version rather than "latest."

## Multi-agent propagation risk

Prompt injection can self-replicate across agent-to-agent handoffs — an injected instruction in one agent's output becomes untrusted input to the next agent that reads it (see the "Morris II" worm and "Prompt Infection" research as documented cases). Do not let an inter-agent message carry executable instructions without the same trust-boundary pattern from `threat-modeling.md` applied at the *receiving* agent, not just the originating one.

## Verification philosophy: prove it can't, don't ask if it will

Do not accept a sandbox, authorization boundary, or injection defense as safe because the model reports it behaved correctly, or because the design looks sound on paper. Verify by attempting the negative case:

- for a sandbox/permission boundary — attempt the escape (reach a path, spawn a process, or call a host outside the declared grant) and confirm it's denied;
- for a delegated-auth boundary — attempt an action the issued token should not cover and confirm the PDP denies it;
- for an injection defense — run a known injection payload through the actual pipeline (not a paraphrase) and confirm the trust-boundary pattern holds, not just that the model "said no" once.

Mark any conclusion not exercised this way as unverified in the review report (`review-and-triage.md`).

## Case study to cite

**EchoLeak (CVE-2025-32711)** — a zero-click Microsoft 365 Copilot exfiltration chain that bypassed an XPIA classifier, link redaction, and CSP egress control in sequence. Useful as the canonical example that a stack of independent, individually-reasonable controls can still fail if no single control owns the end-to-end trust boundary.

## Further reading

- [quidproquo.cc — Agent 安全的同一條裂縫：從 Prompt Injection、信任邊界到 Multi-Agent 蠕蟲](https://quidproquo.cc/posts/ai/2026-06-04-agent-security-prompt-injection-trust-boundaries/) — primary source for the framing, design patterns, and EchoLeak analysis above
- [quidproquo.cc — security tag](https://quidproquo.cc/tags/security/) — recurring coverage of sandbox escape mechanics, delegated-authorization architecture, and current MCP/agent-tool CVEs
- [GenAI Security Project — GenAI/LLM Top 10](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10)
- [MITRE ATLAS](https://atlas.mitre.org/) — adversary tactics/techniques catalog for AI systems
- NIST AI Risk Management Framework and Zero Trust Architecture guidance applied to AI agents — cite when a design needs a governance reference beyond OWASP
