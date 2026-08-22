# Cross-repository and cross-layer delivery

Use this reference when one feature spans several repositories or contracts, or when data flows through storage, services, workers, generated clients, and UI.

## Audit current reality

Build a matrix before implementation:

| Layer or repository | Live base SHA | Existing behavior | Contract source | Generated consumer | Dirty paths | Verification |
|---|---|---|---|---|---|---|

Inspect implementation and runtime wiring. Do not infer completion from UI text, mock handlers, generated type names, an unchecked route, or an old spec task.

Fetch or otherwise refresh the intended remote base when migration numbering, generated output, submodules, or concurrent changes can drift. State when network access or credentials prevent that check.

## Reconcile source contracts

List conflicts among issues, PRD/FRD, specs, code, tests, and live/generated contracts. For each conflict, record:

- competing statements;
- authoritative decision and why;
- superseded artifact or behavior;
- acceptance criteria and regression coverage.

Preserve useful history, but make superseded requirements unmistakable. Do not leave two documents looking equally normative.

## Derive the dependency graph

Typical order is:

1. storage schema and invariants;
2. domain/service behavior and asynchronous lifecycle;
3. API schema and canonical generated types;
4. client services/hooks and UI data flow;
5. browser/runtime integration;
6. cross-repository verification and release metadata.

This is a heuristic, not a hard-coded architecture. Record the actual producer → generated artifact → consumer graph and implement in dependency order.

Never hand-edit generated artifacts. Run the repository's canonical generator after the owning contract changes, then verify expected generated copies are synchronized. Test the exact branch combination that consumers require, not only each repository against stale default branches.

## Enforce cross-layer invariants

Translate properties such as privacy, ownership, idempotency, uniqueness, ordering, retry safety, and cleanup into checks at every relevant layer. Application code alone is insufficient when storage constraints, serialization, queues, logs, notifications, or DOM can violate the same invariant.

For sensitive data, use unique sentinel values and inspect persisted rows, serialized responses, unauthorized-account behavior, DOM, notifications, logs, and browser attachments as applicable. Record surfaces that could not be inspected.

## Isolate concurrent work

Capture repository root, branch/base, `git status --short`, and intended paths for every repository. Treat existing modifications as another owner's work.

When overlapping dirty worktrees make safe verification or staging impossible, use scoped clean worktrees based on the correct live branch. Copy or apply only authorized feature paths, regenerate inside the clean worktree, and repeat tests there. Do not reset, clean, or reformat the shared checkout.

For submodules or pinned dependencies, update the parent pointer only after the child commits exist and report the exact tested combination.

## Cross-repository completion

Record:

- repository, branch, base, and head revision;
- generated contract owner and synchronized consumers;
- dependency and merge order;
- checks run in each repository;
- checks run against the combined branch set;
- exact composite revisions and command used for the combined verification;
- known baseline, dependency, or external blockers.

Individual green test suites do not prove that the combined system works.

Keep delivery state dimensional: `implemented`, `locally verified`, `review resolved`, `PR opened`, `CI green`, `merged`, `deployed`, and `production verified` are independent facts. Report each with its revision or run evidence. A Draft PR plus known CI blocker can still be locally verified, but it is not merged, deployed, or fully CI-green.
