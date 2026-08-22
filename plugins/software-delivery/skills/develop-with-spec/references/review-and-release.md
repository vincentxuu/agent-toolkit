# Review, commit, pull request, and CI handoff

Use this reference only when review or release preparation is requested or required by repository policy. Implementation authority alone does not authorize these external or history-changing actions.

## Review as a correction loop

1. Save each independent review result or a concise repository-approved record.
2. Deduplicate overlapping findings without using agreement as proof.
3. Validate findings against the real code path, dependency semantics, and focused regression tests.
4. Fix accepted blocking or material findings.
5. Run targeted post-fix review and the affected checks.
6. Record rejected findings with concrete evidence and blocked reviewers/tools honestly.

Use multiple reviewers or models only when available and proportional to risk. Do not mark an unavailable reviewer as passing, and do not accept a finding merely because several reviewers repeated it.

## Clean commit preparation

Immediately before staging:

- refresh worktree and staged status in every affected repository;
- list the intended files explicitly;
- run required generators and checks in the clean delivery context;
- scan staged content for secrets and private URLs;
- scan for unexpected large binaries, especially raw Playwright reports, logs, traces, screenshots, and videos;
- run `git diff --check` and inspect `git diff --cached`.

Never use `git add .`, `git add -A`, `git commit -a`, broad cleanup, or unrelated formatting in a shared worktree. Keep raw evidence out of Git unless repository policy explicitly requires it; retain a concise verification summary and use CI artifacts or controlled storage for large evidence.

## Cross-repository pull requests

Create commits, push branches, or open pull requests only with explicit authority. For dependent repositories:

- create separate scoped commits and pull requests;
- cross-link dependencies;
- state deployment and merge order;
- keep pull requests draft until their prerequisites and acceptance gates are clear;
- pin parent/submodule references to real pushed child commits when applicable.

## CI triage

Inspect the first real failing step and classify it:

1. **Feature regression** — fix the change, add regression coverage, and rerun.
2. **Cross-repository dependency** — document the required branch/merge order and rerun after the prerequisite exists.
3. **Baseline or external blocker** — retain logs and limitations; do not weaken checks or call it successful.

A skipped deploy, inaccessible preview log, shared provider outage, or workflow network failure is not proof that feature code passed or failed. Report it separately from deterministic feature evidence.
