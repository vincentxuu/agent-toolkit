---
name: develop-with-spec
description: Run spec-driven software delivery from problem definition through implementation and evidence-backed verification. Use when asked to build, change, fix, or refactor software with an explicit spec, plan, acceptance criteria, implementation tasks, or browser proof. For browser-facing work, require a passing Playwright scenario and recorded video evidence before declaring completion.
---

# Develop With Spec

Deliver one bounded software change through a filesystem-backed specification, an implementation plan, automated checks, and verifiable evidence. Treat the live repository as the source of truth.

## 1. Resolve the delivery contract

1. Resolve the target repository and read its `AGENTS.md` plus linked instructions completely.
2. Inspect the worktree, live remote base when relevant, package scripts, tests, generated-code boundaries, and existing specification system before proposing files or commands.
3. Reuse the repository's native SDD system when present—such as OpenSpec, requirements/design/tasks documents, ADRs, issue templates, or project-specific commands. Do not create a parallel system.
4. If no native system exists, create `.agent-toolkit/specs/<feature-slug>/` from the templates in `assets/`:
   - `spec.md` — problem, scope, non-goals, constraints, acceptance criteria
   - `design.md` — architecture, alternatives, boundaries, risks, and rollback
   - `plan.md` — ordered tasks with exactly one item in progress
   - `verification.md` — commands, outcomes, browser evidence, and gaps
5. Derive a lowercase hyphenated slug from the change; reject path separators, traversal, shell syntax, and ambiguous broad names.

Read `references/spec-workflow.md` completely when creating, resuming, or reconciling delivery artifacts.

Before estimating completion, audit the real implementation rather than visible UI, docs, or checked boxes. Trace each applicable layer—storage, service/API, asynchronous worker, generated contracts, client state, UI, and browser/runtime—and record whether it is real, mocked, partial, absent, or unverified. A rendered prototype or provider menu is not a wired feature.

## 2. Establish an implementable spec

Record observable outcomes rather than implementation wishes. Include:

- current problem and evidence;
- users or callers affected;
- in-scope and explicitly out-of-scope behavior;
- constraints and compatibility requirements;
- acceptance criteria that can be verified;
- cross-layer invariants such as privacy, ownership, idempotency, consistency, or cleanup;
- conflicts among issue, PRD/FRD, existing specs, code, and deployed contract plus the decision that resolves each conflict;
- open decisions, risks, and rollback considerations.

Inspect before asking questions. Ask only when an unresolved decision would materially change product behavior, data, security, or scope. An explicit request to implement a sufficiently bounded change authorizes normal implementation steps; it does not authorize unrelated cleanup, destructive migration, production mutation, commit, push, deploy, or publish.

When the user requested implementation and the derived spec contains no material unresolved choice, that request is sufficient authority to proceed; show the spec summary before coding but do not ask for redundant approval. Follow an explicit approval gate required by the repository's native SDD workflow. Stop and ask when the fallback spec introduces a material product, data, security, migration, or scope decision the user has not made.

Do not implement while critical acceptance criteria contradict each other or depend on missing authority. Mark the artifact blocked with the exact decision needed.

## 3. Plan against the live codebase

Trace the change through the relevant contracts: storage/schema, server or library behavior, generated types, UI/data flow, tests, and operational configuration as applicable. Identify source repositories, dependency order, generated outputs, branch/base combinations, and downstream consumers before splitting work.

For multi-repository changes, generated API/type boundaries, migrations, queues, or cross-layer security invariants, read `references/cross-repo-delivery.md` completely. Implement producers before generated contracts and consumers unless the live dependency graph proves another order.

Write small, verifiable tasks. Every task must state the expected code surface and its check. Keep one task `in_progress`; update the plan after each meaningful result. Preserve unrelated dirty-worktree changes and never discard work that predates this run.

If the repository's native plan conflicts with observed code, update or flag the plan before implementing. Do not silently reinterpret completed checklist items.

## 4. Implement incrementally

For each task:

1. Refresh the relevant files and worktree state.
2. Make the smallest coherent change that satisfies the acceptance criterion.
3. Run the closest focused test or static check.
4. Record the result and update plan state on disk.
5. Continue only when the previous task has usable evidence or a documented non-blocking gap.

Follow repository commands and generated-code boundaries. Do not bypass hooks, weaken tests, replace semantic user content mechanically, or claim external behavior from local-only evidence.

## 5. Verify in layers

Run verification in increasing scope:

1. focused tests for changed behavior;
2. relevant type, lint, schema, build, or integration checks;
3. repository-required full verification;
4. acceptance-criteria walkthrough;
5. Playwright browser evidence for every browser-visible flow.
6. environment teardown and residue checks for integration/E2E runs.
7. independent review and post-fix regression checks when repository policy or change risk requires them.

Record exact commands, exit status, and what each check proves in `verification.md` or the repository's native equivalent. A passing build does not prove the user flow; a video does not prove hidden state, API, accessibility, cleanup, privacy, or all assertions. Use sentinel data and inspect every relevant surface when an invariant concerns secrets or private content.

## 6. Record Playwright evidence

For any browser-facing acceptance criterion, read `references/playwright-evidence.md` completely and produce a focused Playwright test that:

- starts from a deterministic state;
- performs the real user flow with semantic locators;
- asserts the meaningful final state;
- enables `video: 'on'` for the evidence run;
- closes successfully so the video is finalized;
- keeps trace and failure screenshots when the repository supports them.

Prefer the repository's installed Playwright version, config, web server, fixtures, and authentication setup. Do not install dependencies, start external services, use production data, or embed credentials without authority.

After the test exits successfully, locate the emitted `.webm` and run:

```bash
node <skill-root>/scripts/verify-playwright-video.mjs <video-or-directory>
```

Copy or retain the accepted video under the repository's established artifact directory. If none exists, use `.agent-toolkit/evidence/<feature-slug>/<run-id>/` and record that path. Evidence files are untracked by default unless the repository or user explicitly requires committing them.

Do not declare browser verification complete unless the focused Playwright test passed and at least one video passed artifact validation. Visually inspect the recording when the current environment supports video viewing; otherwise state that the recording was structurally validated but not visually reviewed.

For a non-browser change, mark Playwright video `N/A` with a concrete reason. For a browser change where Playwright or recording is unavailable, report a blocker; screenshots or manual narration are not silent substitutes.

## 7. Reconcile and hand off

When preparing independent review, commits, pushes, pull requests, or CI handoff, read `references/review-and-release.md` completely. These steps require explicit authority and never follow automatically from implementation approval.

Before completion:

- map every acceptance criterion to evidence or an explicit gap;
- update spec and plan status to match reality;
- refresh `git status` and exclude unrelated changes;
- list created or modified paths;
- report tests and Playwright artifacts with exact paths;
- prove E2E-created rows, jobs, files, processes, and other disposable state were cleaned, or list the residue;
- record accepted, rejected, blocked, and post-fix review findings when review was required;
- for cross-repository delivery, report branch/base, dependency and merge order, and the tested cross-branch combination;
- report implemented, locally verified, review-resolved, PR-opened, CI-green, merged, deployed, and production-verified as separate statuses rather than one “done” flag;
- distinguish verified local behavior from unverified external or production behavior;
- state remaining decisions and external actions.

Do not mark the work complete because code exists or a checklist is nearly done. Local delivery completion requires reconciled contracts, satisfied acceptance criteria, required repository checks, verified cleanup, resolved blocking review findings, and recorded browser proof when applicable. Never imply merge, deployment, production behavior, or external CI success from local completion.
