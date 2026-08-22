# Update workflow

## Locate and classify

1. Resolve the existing article by exact path, URL, slug, or title search; present candidates instead of guessing when multiple match.
2. Read the entire article plus any existing language companion, series metadata, global glossary entry, and repository update rules.
3. Decide whether the revised result remains the same article. Preserve its identity when it does; propose a new linked article when the subject, conclusion, or audience has materially changed.
4. Translate the requested changes into a concrete scope. Ask one question only if ambiguity would change the article's identity or factual meaning.
5. Record the target paths plus current worktree and staged state before editing so unrelated changes remain distinguishable.

## Preserve identity and integrate changes

- Preserve the original filename, slug, publication `date`, and canonical route unless the user explicitly authorizes a migration and its redirects.
- Preserve category, language, and series placement unless the request changes them.
- Set the repository's `updated` field to the environment's local date for a substantive revision; do not change it for a trivial typo unless the project says otherwise.
- Rewrite new material into the existing structure instead of appending patch-like asides.
- Update a visible changelog when the project uses one: skip it for trivial copy edits, add substantive changes in reverse chronological order, and place it where the live convention requires.
- Synchronize an existing translation or companion only when it exists or the requested scope includes one. Report any intentionally unsynchronized companion.

## Refresh facts and references

Re-verify changed prices, versions, dates, API names, flags, benchmarks, legal/policy claims, statistics, and research conclusions against current primary sources. Update inline citations and bibliography together. Never replace a stale claim from memory.

Re-read the full article after multi-section or multi-pass edits. Check that its opening promise, cross-section references, counts, terminology, and conclusion still agree.

## Quidproquo update rules

- Preserve filename, slug, original `date`, category, `lang`, and `series` by default.
- For substantive changes, set frontmatter `updated: YYYY-MM-DD` and add or prepend an `## 更新紀錄` entry before references.
- When a zh/en pair exists, apply equivalent substantive changes, keep `date`, `updated`, and `series.order` equal, heading-count drift within 25%, and changelog counts equal.
- Check global glossary terms first; change `src/lib/glossary/terms.ts` only when the shared definition is in scope.
- Run `pnpm verify`. For long Chinese content, run the available register scanner. Run the documented content schema/build check when publishing requires it.
- Distinguish structural validation from factual and external-link verification.
- Re-check worktree and staged state, then show the complete article diff and every changed path. If commit is authorized, stage only those paths and use the live `post(<category>): update <summary>` convention.
