# Create workflow

## Metadata gate

Determine the audience, purpose, language, article form, title direction, short lowercase kebab-case slug, category, tags, date, required frontmatter, evidence needs, and output destination before drafting. Ask one precise question only when a missing choice materially changes the result.

For an experience, incident, debugging, or project article, build a fact inventory from the supplied material: observed symptom, actual environment, attempted steps, implemented change, causal evidence, and measured outcome. Do not infer a queue, worker, scheduler, idempotency mechanism, job identity, control flow, or root cause merely because it would be a common design. If those details are necessary to make the requested article useful, ask for them; otherwise write a narrower article and label hypothetical architecture as an example or recommendation rather than what happened.

Read `references/writing-principles.md`. Choose the closest generic skeleton:

- debugging or problem solving: `assets/templates/debug.md`;
- tool, concept, architecture, or evidence review: `assets/templates/deep-dive.md`;
- non-technical or free-form narrative: `assets/templates/general.md`.

The target repository's schema, voice, and templates override generic scaffolding.

## Draft

Introduce an external object early, choose one organizing spine, and make recommendations executable. Preserve exact code, URLs, paths, and commands after removing secrets. Do not manufacture first-person experience or fill missing technical steps with plausible prose.

For a filesystem target, create only authorized article and supporting metadata files. For Web/no-filesystem use, return the complete article as Markdown or an artifact.

## Validate and review

Run documented article checks and the target's canonical repository gate. Fix failures caused by the article and report unrelated failures separately. Show the draft and changed paths. Commit or publish only when authorized, staging only an explicit path allowlist.
