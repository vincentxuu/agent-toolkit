# Threat Model: <feature or change name>

Status: draft | active | superseded
Owner: <name>
Last updated: <date>

## 1. What are we building?

<One paragraph. Link the spec/design doc if one exists.>

### Data flow

<Actors, entry points, processes, data stores, and every trust boundary a request crosses. A short list or an inline diagram is fine — it must be legible without external tools.>

### Trust boundaries identified

1. <boundary 1, e.g. "public internet → API gateway">
2. <boundary 2>

## 2. What can go wrong? (STRIDE)

| Threat | STRIDE category | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| | Spoofing | | | | Open / Mitigated / Accepted |
| | Tampering | | | | |
| | Repudiation | | | | |
| | Information Disclosure | | | | |
| | Denial of Service | | | | |
| | Elevation of Privilege | | | | |

## 3. Agentic surface (delete this section if not applicable)

### Lethal trifecta check

- Private/sensitive data access: yes / no — <what>
- Untrusted content exposure: yes / no — <source>
- External communication capability: yes / no — <channel>
- Verdict: <if all three are yes, state which leg is being removed and how>

### Trust-boundary design pattern applied

<Action-Selector / Plan-Then-Execute / LLM Map-Reduce / Dual LLM / Code-Then-Execute / Context-Minimization / other — and why>

### Capability enumeration (sandbox / tool grants)

| Axis | Reachable / held | Justification |
|---|---|---|
| Filesystem paths | | |
| Spawnable processes | | |
| Network destinations | | |
| Credentials / tokens | | |
| Callable tools | | |
| Output destinations | | |

## 4. What are we going to do about it?

<Summarize the mitigations from the tables above that require design changes, in priority order.>

## 5. Open risks

| Risk | Owner | Decision needed | Target date |
|---|---|---|---|
| | | | |

## 6. Did we do a good job? (re-check after implementation)

<Re-run this section against the as-built system before sign-off. Note any drift from this model.>
