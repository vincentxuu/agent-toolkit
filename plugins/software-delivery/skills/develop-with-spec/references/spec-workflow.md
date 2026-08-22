# Spec-driven delivery workflow

Use this reference to create or reconcile delivery artifacts. Prefer a repository-native format; use the bundled templates only when no established system exists.

## Artifact lifecycle

| State | Spec | Plan | Verification | Implementation |
|---|---|---|---|---|
| Proposed | Problem and outcomes are drafted | Major workstreams identified | Verification strategy drafted | Not started |
| Ready | Scope, constraints, and acceptance criteria are implementable | Tasks map to live code and checks | Required test layers identified | May start |
| In progress | Changes are reconciled as facts emerge | One task is active | Results accumulate | Active |
| Blocked | Blocking decision is explicit | Blocked task identifies dependency | Missing proof is explicit | Stop affected work |
| Complete | Final behavior matches delivered scope | All required tasks complete | Every acceptance criterion has evidence | Ready for handoff |

Do not use completion labels to hide skipped checks or unresolved product decisions.

## Discover a native system

Inspect, in order:

1. `AGENTS.md` and linked governance files;
2. project documentation and package commands mentioning spec, proposal, plan, ADR, RFC, OpenSpec, Specify, or tasks;
3. known markers such as `openspec/`, `.openspec.yaml`, `.kiro/specs/`, or repository-owned spec directories;
4. existing nearby change artifacts;
5. issue or pull-request templates when they are the project's accepted planning contract.

When the repository has a native workflow, use its filenames, commands, lifecycle, and archive rules. The `.agent-toolkit/specs/` fallback must not coexist as a second source of truth for the same change.

## Write acceptance criteria

Each criterion must identify:

- an actor or caller;
- an action or event;
- an observable outcome;
- relevant error, permission, or empty-state behavior;
- the evidence that will prove it.

Good:

> Given an authenticated editor with an unsaved title, when they select Save, the page shows the persisted title after reload and only one update request is accepted.

Weak:

> Improve save behavior and add tests.

Split criteria when one sentence requires unrelated proofs. Avoid prescribing implementation unless it is a real constraint.

## Plan tasks

Order tasks by dependency and risk:

1. storage schema, migrations, and data invariants when applicable;
2. core service behavior and asynchronous lifecycle;
3. API schema and canonical generated contracts;
4. client integration and UI flow;
5. compatibility or backfill work at the layer that owns it;
6. focused, cross-layer, and full checks;
7. Playwright evidence, teardown, and artifact verification;
8. documentation and handoff.

For each task, record files or modules, intended outcome, and check. Do not create vague tasks such as “finish frontend” or “test everything.”

## Reconcile discoveries

Implementation often reveals that the original plan is wrong. When that happens:

1. record the observed fact and file/line evidence;
2. decide whether it changes scope, design, or only the task sequence;
3. update artifacts before continuing;
4. request direction only when the change is material or needs new authority.

Never rewrite history by marking an obsolete task complete. Mark it superseded or update it with an explanation according to the repository's format.

## Approval boundary

- A repository-native approval rule always wins.
- A request that explicitly authorizes implementation may proceed after a non-controversial fallback spec is written and summarized.
- A request for exploration, proposal, design, or planning alone stops before application code.
- New product behavior, destructive migration, external writes, deployment, archive, commit, and push retain their own authority gates.
- A material discovery that changes approved scope or design must be written back to the owning artifact before implementation continues.

## Completion matrix

Use a compact matrix in the verification artifact:

| Acceptance criterion | Evidence | Result | Gap |
|---|---|---|---|
| AC-1 | focused test and command | Pass/Fail | none or exact limitation |
| AC-2 | Playwright test + `.webm` | Pass/Fail | visual review status |

Schema checks, unit tests, browser assertions, recordings, and production validation prove different things. Do not substitute one evidence type for another without saying so.
